#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const HALF_STEP_EPSILON = 0.0001;
const VISUAL_LEAF_TYPES = new Set([
  'BOOLEAN_OPERATION', 'ELLIPSE', 'LINE', 'POLYGON', 'RECTANGLE', 'STAR', 'TEXT', 'VECTOR'
]);

function parseArguments(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--manifest') options.manifest = argumentsList[++index];
    else if (argument === '--node-data') options.nodeData = argumentsList[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.manifest) throw new Error('Missing --manifest');
  return options;
}

function parseFigmaUrl(rawUrl) {
  const url = new URL(rawUrl);
  const match = url.pathname.match(/^\/design\/([A-Za-z0-9]+)(?:\/|$)/);
  if (!match) throw new Error(`Unable to parse fileKey from Figma URL: ${rawUrl}`);
  return { fileKey: match[1], url };
}

function buildNodeUrl(rawUrl, nodeId) {
  const url = new URL(rawUrl);
  const inheritedMatch = nodeId.match(/^I(\d+:\d+);/);
  const addressableNodeId = inheritedMatch?.[1] ?? nodeId;
  url.searchParams.set('node-id', addressableNodeId.replace(':', '-'));
  return url.toString();
}

function flattenTree(root) {
  const nodes = new Map();
  const parents = new Map();
  const visit = (node, parentId) => {
    if (!node || typeof node.id !== 'string') return;
    nodes.set(node.id, node);
    if (parentId) parents.set(node.id, parentId);
    for (const child of node.children ?? []) visit(child, node.id);
  };
  visit(root, '');
  return { nodes, parents };
}

function ancestry(nodeId, parents) {
  const ids = [];
  let current = nodeId;
  while (current) {
    ids.push(current);
    current = parents.get(current) ?? '';
  }
  return ids;
}

function findLowestCommonAncestor(nodeIds, parents) {
  const paths = nodeIds.map((nodeId) => ancestry(nodeId, parents));
  if (paths.length === 0 || paths.some((path) => path.length === 0)) return '';
  return paths[0].find((candidate) => paths.every((path) => path.includes(candidate))) ?? '';
}

function descendants(nodeId, nodes) {
  const result = new Set();
  const visit = (currentId) => {
    if (result.has(currentId)) return;
    result.add(currentId);
    const node = nodes.get(currentId);
    for (const child of node?.children ?? []) visit(child.id);
  };
  visit(nodeId);
  return result;
}

function normalizeHalfStep(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = Math.round(value * 2) / 2;
  return Math.abs(value - normalized) <= HALF_STEP_EPSILON ? normalized : null;
}

function normalizeBounds(bounds) {
  if (!bounds) return null;
  const normalized = {
    x: normalizeHalfStep(bounds.x),
    y: normalizeHalfStep(bounds.y),
    width: normalizeHalfStep(bounds.width),
    height: normalizeHalfStep(bounds.height)
  };
  return Object.values(normalized).some((value) => value === null) ? null : normalized;
}

function isVisiblePaint(paint) {
  return paint?.visible !== false && paint?.type !== 'NONE' && (paint?.opacity ?? 1) > 0;
}

function hasOwnVisual(node) {
  if (!node || node.visible === false || (node.opacity ?? 1) <= 0) return false;
  if ((node.fills ?? []).some(isVisiblePaint) || (node.strokes ?? []).some(isVisiblePaint)) return true;
  if ((node.effects ?? []).some((effect) => effect.visible !== false)) return true;
  if (node.isMask === true) return true;
  if (node.type === 'TEXT' && typeof node.characters === 'string' && node.characters.length > 0) return true;
  return VISUAL_LEAF_TYPES.has(node.type) && (node.children ?? []).length === 0;
}

function buildAllowedClosure(selectedId, requiredIds, nodes, parents) {
  const allowed = new Set([selectedId]);
  for (const requiredId of requiredIds) {
    for (const id of descendants(requiredId, nodes)) allowed.add(id);
    let current = requiredId;
    while (current && current !== selectedId) {
      allowed.add(current);
      current = parents.get(current) ?? '';
    }
  }
  return allowed;
}

function findContamination(selectedId, requiredIds, nodes, parents) {
  const allowed = buildAllowedClosure(selectedId, requiredIds, nodes, parents);
  const selectedTree = descendants(selectedId, nodes);
  const contaminated = [];
  for (const id of selectedTree) {
    const node = nodes.get(id);
    if (!allowed.has(id) && hasOwnVisual(node)) contaminated.push(node.name || node.type || 'visible content');
  }
  const selectedNode = nodes.get(selectedId);
  if (!requiredIds.includes(selectedId) && hasOwnVisual(selectedNode)) {
    contaminated.push(selectedNode.name || selectedNode.type || 'container visual content');
  }
  return [...new Set(contaminated)];
}

function containsBounds(container, child) {
  if (!container || !child) return false;
  const epsilon = HALF_STEP_EPSILON;
  return child.x >= container.x - epsilon && child.y >= container.y - epsilon &&
    child.x + child.width <= container.x + container.width + epsilon &&
    child.y + child.height <= container.y + container.height + epsilon;
}

function humanProblem(decision) {
  if (decision.problemCode === 'ai-decision-missing') return 'Whether the image, glow, mask, or decoration belongs to one resource is not yet confirmed.';
  if (decision.numericStatus === 'invalid') return 'The image boundary contains coordinates or dimensions that are neither integers nor .5 values.';
  if (decision.problemCode === 'contaminated') return 'The current boundary also contains a background, text, or other visible content not proven to belong to the image.';
  if (decision.problemCode === 'layout-slot') return 'The current boundary is a layout or hit-target region and is not proven to be the image itself.';
  if (decision.problemCode === 'missing-node') return 'The complete node range forming the image cannot be read.';
  if (decision.problemCode === 'outside-search-root') return 'Image content extends beyond the allowed semantic boundary, so no independent export container can be found.';
  if (decision.problemCode === 'incomplete-bounds') return 'The current boundary does not fully contain the image and its visual effects.';
  return 'No smallest complete and independent image boundary can be found.';
}

function resolveResource(resource, nodeResponse) {
  const base = {
    boundaryDecisionId: resource.boundaryDecisionId,
    resourceDecisionId: resource.resourceDecisionId,
    resourceName: resource.resourceName,
    figmaNodeUrl: resource.figmaUrl,
    layoutSlotNodeIds: resource.layoutSlotNodeIds ?? [],
    requiredVisualNodeIds: resource.requiredVisualNodeIds ?? [],
    decisionPacketId: resource.decisionPacketId ?? '',
    visualClosureDecisionId: resource.visualClosureDecisionId ?? '',
    visualClosureDecisionStatus: resource.visualClosureDecisionStatus ?? 'unresolved',
    visualClosureDecisionProvenance: resource.visualClosureDecisionProvenance ?? '',
    candidateNodeIds: [],
    selectedExportNodeId: '',
    selectedBounds: null,
    imageDisplaySize: null,
    purityStatus: 'unknown',
    numericStatus: 'invalid',
    decisionStatus: 'unresolved',
    manualDecision: '',
    problem: ''
  };
  if (resource.manualDecision === 'skip-resource') {
    return {
      ...base,
      decisionStatus: 'skipped',
      manualDecision: 'skip-resource',
      problem: 'The user explicitly skipped this resource.'
    };
  }
  if (!resource.visualClosureDecisionId || resource.visualClosureDecisionStatus !== 'confirmed') {
    return { ...base, problemCode: 'ai-decision-missing', problem: 'The resource lacks a confirmed visual-closure decision.' };
  }
  const rootEntry = nodeResponse.nodes?.[resource.boundarySearchRootNodeId];
  const root = rootEntry?.document;
  if (!root) return { ...base, problemCode: 'missing-node', problem: 'Unable to read the boundary search root.' };

  const { nodes, parents } = flattenTree(root);
  const requiredIds = resource.requiredVisualNodeIds?.length > 0
    ? resource.requiredVisualNodeIds
    : resource.visualSeedNodeIds ?? [];
  if (requiredIds.length === 0 || requiredIds.some((id) => !nodes.has(id))) {
    return { ...base, problemCode: 'missing-node', problem: 'A required visual node is missing.' };
  }

  const selectedId = findLowestCommonAncestor(requiredIds, parents);
  const candidates = selectedId ? ancestry(selectedId, parents) : [];
  if (!selectedId || !candidates.includes(resource.boundarySearchRootNodeId)) {
    return { ...base, candidateNodeIds: candidates, problemCode: 'outside-search-root', problem: 'Required visual nodes do not share one allowed boundary.' };
  }

  const selectedNode = nodes.get(selectedId);
  const selectedBounds = selectedNode?.absoluteBoundingBox;
  const normalizedBounds = normalizeBounds(selectedBounds);
  const decision = {
    ...base,
    figmaNodeUrl: buildNodeUrl(resource.figmaUrl, selectedId),
    requiredVisualNodeIds: requiredIds,
    candidateNodeIds: candidates,
    selectedExportNodeId: selectedId,
    selectedBounds: normalizedBounds,
    imageDisplaySize: normalizedBounds ? { width: normalizedBounds.width, height: normalizedBounds.height } : null,
    numericStatus: normalizedBounds ? 'valid' : 'invalid'
  };
  if (!normalizedBounds) {
    return { ...decision, problemCode: 'invalid-number', problem: 'The candidate boundary is not on the half-pixel grid.' };
  }
  if ((resource.layoutSlotNodeIds ?? []).includes(selectedId)) {
    return { ...decision, problemCode: 'layout-slot', problem: 'The candidate boundary is a layout slot and cannot be an image export boundary.' };
  }
  const hasIncompleteBounds = requiredIds.some((id) => !containsBounds(selectedBounds, nodes.get(id)?.absoluteRenderBounds));
  if (hasIncompleteBounds) {
    return { ...decision, problemCode: 'incomplete-bounds', problem: 'The candidate boundary does not fully contain the required visual content.' };
  }
  const contamination = findContamination(selectedId, requiredIds, nodes, parents);
  if (contamination.length > 0) {
    if (resource.manualDecision === 'accept-current-boundary' && resource.approvedExportNodeId === selectedId) {
      return {
        ...decision,
        purityStatus: 'manual-approved',
        decisionStatus: 'resolved',
        manualDecision: 'accept-current-boundary',
        problemCode: '',
        problem: ''
      };
    }
    return {
      ...decision,
      purityStatus: 'contaminated',
      decisionStatus: 'manual-review',
      problemCode: 'contaminated',
      problem: `Candidate contains additional visible content: ${contamination.join(', ')}`
    };
  }
  return {
    ...decision,
    purityStatus: 'clean',
    decisionStatus: 'resolved',
    problemCode: '',
    problem: ''
  };
}

async function fetchNodeData(fileKey, rootNodeIds) {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('Missing FIGMA_TOKEN; unable to verify Figma node boundaries');
  const ids = [...new Set(rootNodeIds)].join(',');
  const query = new URLSearchParams({ ids });
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?${query.toString()}`, {
    headers: { 'X-Figma-Token': token }
  });
  if (!response.ok) throw new Error(`Failed to read Figma nodes (HTTP ${response.status})`);
  return response.json();
}

export async function resolveExportBoundaries(manifest, nodeData) {
  if (!Array.isArray(manifest.resources) || manifest.resources.length === 0) {
    throw new Error('Boundary manifest is missing resources[]');
  }
  const fileKeys = new Set(manifest.resources.map((resource) => parseFigmaUrl(resource.figmaUrl).fileKey));
  if (fileKeys.size !== 1) throw new Error('One boundary manifest can process only one Figma file');
  const fileKey = [...fileKeys][0];
  const resolvedNodeData = nodeData ?? await fetchNodeData(
    fileKey,
    manifest.resources.map((resource) => resource.boundarySearchRootNodeId)
  );
  const decisions = manifest.resources.map((resource) => resolveResource(resource, resolvedNodeData));
  const manualReview = decisions
    .filter((decision) => decision.decisionStatus === 'manual-review' || decision.decisionStatus === 'unresolved')
    .map((decision) => ({
      resourceName: decision.resourceName,
      figmaNodeUrl: decision.figmaNodeUrl,
      problem: humanProblem(decision),
      choices: ['export current boundary', 'provide the correct image link', 'skip this resource']
    }));
  return {
    fileKey,
    decisions,
    manualReview,
    canDownload: manualReview.length === 0 &&
      decisions.every((decision) => ['resolved', 'skipped'].includes(decision.decisionStatus))
  };
}

async function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const manifest = JSON.parse(await readFile(options.manifest, 'utf8'));
    const nodeData = options.nodeData ? JSON.parse(await readFile(options.nodeData, 'utf8')) : undefined;
    process.stdout.write(`${JSON.stringify(await resolveExportBoundaries(manifest, nodeData), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`[figma-export-boundary-selection] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
