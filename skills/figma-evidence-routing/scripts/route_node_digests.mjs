#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const CONTAINER_TYPES = new Set(['COMPONENT', 'COMPONENT_SET', 'FRAME', 'GROUP', 'INSTANCE', 'SECTION']);
const DEEP_VISUAL_SIGNALS = new Set(['BLEND', 'CLIP', 'EFFECT', 'MASK', 'MIXED', 'MULTI_LAYER', 'UNKNOWN']);
const TRUSTED_COMPLETION_SOURCES = new Set(['code-connect', 'same-request-context', 'versioned-cache']);

function normalizedArray(value) {
  return [...new Set(Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.length > 0) : [])].sort();
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex').slice(0, 20);
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest.fileKey !== 'string' || manifest.fileKey.length === 0) throw new Error('Missing fileKey');
  if (!Array.isArray(manifest.nodeFacts) || manifest.nodeFacts.length === 0) throw new Error('Missing nodeFacts[]');
  if (!Array.isArray(manifest.targetNodeIds) || manifest.targetNodeIds.length === 0) throw new Error('Missing targetNodeIds[]');
  const ids = new Set();
  for (const node of manifest.nodeFacts) {
    if (!node || typeof node.nodeId !== 'string' || node.nodeId.length === 0) throw new Error('nodeFacts contains an invalid nodeId');
    if (ids.has(node.nodeId)) throw new Error(`nodeFacts contains duplicate nodeId: ${node.nodeId}`);
    ids.add(node.nodeId);
  }
  for (const targetId of manifest.targetNodeIds) {
    if (!ids.has(targetId)) throw new Error(`targetNodeIds references a missing node: ${targetId}`);
  }
}

function buildStructuralFingerprint(nodeId, nodes, memo, visiting) {
  if (memo.has(nodeId)) return memo.get(nodeId);
  if (visiting.has(nodeId)) throw new Error(`Node tree contains a cycle: ${nodeId}`);
  const node = nodes.get(nodeId);
  if (!node) throw new Error(`childNodeIds references a missing node: ${nodeId}`);
  visiting.add(nodeId);
  const childFingerprints = (node.childNodeIds ?? []).map((childId) => buildStructuralFingerprint(childId, nodes, memo, visiting));
  visiting.delete(nodeId);
  const result = fingerprint({
    type: node.type ?? '',
    componentKey: node.componentKey ?? '',
    variantKey: node.variantKey ?? '',
    layoutMode: node.layoutMode ?? '',
    semanticSignals: normalizedArray(node.semanticSignals),
    interactionSignals: normalizedArray(node.interactionSignals),
    visualSignals: normalizedArray(node.visualSignals),
    styleTokenIds: normalizedArray(node.styleTokenIds),
    children: childFingerprints
  });
  memo.set(nodeId, result);
  return result;
}

function classifyRoute(nodes) {
  for (const node of nodes) {
    if ((node.unknownFields ?? []).length > 0 || (node.visualSignals ?? []).some((signal) => DEEP_VISUAL_SIGNALS.has(signal))) {
      return 'deep';
    }
  }
  const representative = nodes[0];
  if (normalizedArray(representative.semanticSignals).length > 0 ||
      normalizedArray(representative.interactionSignals).length > 0 ||
      CONTAINER_TYPES.has(representative.type) ||
      (representative.childNodeIds ?? []).length > 0) return 'semantic';
  return 'fast';
}

function sharedFacts(nodes) {
  const first = nodes[0];
  return {
    type: first.type ?? '',
    componentKey: first.componentKey ?? '',
    variantKey: first.variantKey ?? '',
    layoutMode: first.layoutMode ?? '',
    semanticSignals: normalizedArray(first.semanticSignals),
    interactionSignals: normalizedArray(first.interactionSignals),
    visualSignals: normalizedArray(first.visualSignals),
    styleTokenIds: normalizedArray(first.styleTokenIds)
  };
}

function instanceDeltas(nodes) {
  return nodes.map((node) => ({
    nodeId: node.nodeId,
    name: node.name ?? '',
    width: Number.isFinite(node.width) ? node.width : null,
    height: Number.isFinite(node.height) ? node.height : null,
    variantKey: node.variantKey ?? '',
    contentFingerprint: node.contentFingerprint ?? '',
    variableFingerprint: node.variableFingerprint ?? '',
    assetIdentity: node.assetIdentity ?? '',
    evidenceCompleteness: node.evidenceCompleteness ?? 'metadata',
    completionSource: node.completionSource ?? 'none'
  }));
}

function differingFields(nodes) {
  const fields = ['name', 'width', 'height', 'variantKey', 'contentFingerprint', 'variableFingerprint', 'assetIdentity'];
  return fields.filter((field) => new Set(nodes.map((node) => node[field] ?? '')).size > 1);
}

function resolveReadPolicy(route, nodes, hasVersion) {
  const isComplete = nodes.every((node) =>
    node.evidenceCompleteness === 'complete' && TRUSTED_COMPLETION_SOURCES.has(node.completionSource) &&
      (node.completionSource !== 'versioned-cache' || hasVersion)
  );
  if (route === 'fast' && isComplete) return 'metadata-only';
  if (route === 'deep') return 'staged-context';
  return 'representative-context';
}

function expandConditions(route) {
  if (route === 'fast') return [];
  const shared = ['Representative conflicts with instance variables, copy, dimensions, or state'];
  return route === 'deep'
    ? [...shared, 'Mask, effect, or multilayer visual closure remains unresolved', 'An unclassified visible node or unknown field appears']
    : shared;
}

export function routeNodeDigests(manifest) {
  validateManifest(manifest);
  const nodes = new Map(manifest.nodeFacts.map((node) => [node.nodeId, node]));
  const memo = new Map();
  const groups = new Map();
  for (const targetId of manifest.targetNodeIds) {
    const structuralFingerprint = buildStructuralFingerprint(targetId, nodes, memo, new Set());
    const group = groups.get(structuralFingerprint) ?? [];
    group.push(nodes.get(targetId));
    groups.set(structuralFingerprint, group);
  }

  const hasVersion = typeof manifest.fileVersion === 'string' && manifest.fileVersion.length > 0;
  const digests = [...groups.entries()].map(([structuralFingerprint, groupNodes]) => {
    const route = classifyRoute(groupNodes);
    const readPolicy = resolveReadPolicy(route, groupNodes, hasVersion);
    const representativeNodeId = groupNodes[0].nodeId;
    const initialContextNodeIds = readPolicy === 'metadata-only' ? [] : [representativeNodeId];
    return {
      digestId: `digest-${structuralFingerprint}`,
      structuralFingerprint,
      representativeNodeId,
      sourceNodeIds: groupNodes.map((node) => node.nodeId),
      route,
      routingRisk: route === 'fast' ? 'low' : route === 'semantic' ? 'medium' : 'high',
      aiDecisionRequired: true,
      aiReviewPolicy: readPolicy === 'metadata-only' ? 'cached-evidence-revalidation' : 'fresh-review',
      readPolicy,
      initialContextNodeIds,
      reuseNodeIds: groupNodes.slice(initialContextNodeIds.length).map((node) => node.nodeId),
      expandWhen: expandConditions(route),
      cacheScope: hasVersion ? 'persistent' : 'request',
      cacheKey: `${manifest.fileKey}:${hasVersion ? manifest.fileVersion : 'request'}:${structuralFingerprint}`,
      sharedFacts: sharedFacts(groupNodes),
      instanceDeltas: instanceDeltas(groupNodes),
      perInstanceEvidenceRequired: differingFields(groupNodes)
    };
  });

  const initialContextNodeIds = digests.flatMap((digest) => digest.initialContextNodeIds);
  const routeCounts = { fast: 0, semantic: 0, deep: 0 };
  for (const digest of digests) routeCounts[digest.route] += 1;
  return {
    fileKey: manifest.fileKey,
    fileVersion: hasVersion ? manifest.fileVersion : '',
    nodeDigest: digests,
    initialContextNodeIds,
    routingSummary: {
      targetCount: manifest.targetNodeIds.length,
      digestCount: digests.length,
      initialContextReadCount: initialContextNodeIds.length,
      avoidedInitialContextReads: manifest.targetNodeIds.length - initialContextNodeIds.length,
      routeCounts,
      persistentCacheAllowed: hasVersion
    }
  };
}

function parseArguments(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--manifest') options.manifest = argumentsList[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.manifest) throw new Error('Missing --manifest');
  return options;
}

async function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const manifest = JSON.parse(await readFile(options.manifest, 'utf8'));
    process.stdout.write(`${JSON.stringify(routeNodeDigests(manifest), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`[figma-evidence-routing] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
