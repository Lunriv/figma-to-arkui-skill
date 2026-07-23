#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateLayoutConstraints } from './validate_layout_constraints.mjs';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  let projectRoot = '';
  let manifest = '';
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--project-root') {
      projectRoot = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--manifest') {
      manifest = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--help') {
      process.stdout.write('Usage: node audit_arkui_semantics.mjs --project-root <project-root> --manifest <audit-manifest.json>\n');
      process.exit(0);
    } else {
      fail(`Unsupported argument: ${argument}`);
    }
  }
  if (projectRoot.length === 0) fail('Missing --project-root');
  if (manifest.length === 0) fail('Missing --manifest');
  return { projectRoot: resolve(projectRoot), manifest: resolve(manifest) };
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasComponent(source, component) {
  return new RegExp(`\\b${escapePattern(component)}\\s*\\(`).test(source);
}

function hasInteraction(source, interaction) {
  if (interaction === 'tabs-change') return /\.onChange\s*\(|\.onTabBarClick\s*\(/.test(source);
  if (interaction === 'item-selection') return /\.onClick\s*\(/.test(source);
  if (interaction === 'input') return /\b(?:TextInput|TextArea)\s*\(/.test(source);
  if (interaction === 'toggle') return /\.onChange\s*\(/.test(source);
  if (interaction === 'scroll') return /\b(?:List|Grid|Scroll)\s*\(/.test(source);
  return false;
}

function hasPresentationApi(source, presentationApi) {
  if (presentationApi === 'none') return true;
  return new RegExp(`\\.${presentationApi}\\s*\\(`).test(source);
}

function findTextGlyphFallbacks(source) {
  const issues = [];
  const lines = source.split('\n');
  const suspicious = /(?:✓|‹|›|•••|↑|✦|★|☆|🌟)/u;
  const pictographic = /\p{Extended_Pictographic}/u;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/\bText\s*\(/.test(line) && (suspicious.test(line) || pictographic.test(line))) {
      issues.push(index + 1);
    }
  }
  return issues;
}

function findInlineTextLiterals(source) {
  const issues = [];
  const patterns = [
    /\bText\s*\(\s*(['"`])(.+?)\1/,
    /\bplaceholder\s*:\s*(['"`])(.+?)\1/,
  ];
  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (patterns.some((pattern) => pattern.test(lines[index]))) issues.push(index + 1);
  }
  return issues;
}

function findFixedBlanks(source) {
  const issues = [];
  const pattern = /Blank\(\)([\s\S]{0,240}?);/g;
  let match = pattern.exec(source);
  while (match !== null) {
    if (/\.(?:width|height|backgroundColor|border)\s*\(/.test(match[1])) {
      issues.push(source.slice(0, match.index).split('\n').length);
    }
    match = pattern.exec(source);
  }
  return issues;
}

function isHalfStep(value) {
  return typeof value === 'number' && Number.isFinite(value) &&
    Math.abs(value * 2 - Math.round(value * 2)) <= 0.0001;
}

function auditResourceBoundary(boundary, authorities, issues) {
  const id = boundary.id;
  if (boundary.decisionStatus === 'skipped' && boundary.manualDecision === 'skip-resource') return;
  if (boundary.decisionStatus !== 'resolved') {
    issues.push({ id, rule: 'boundary-status', decisionStatus: boundary.decisionStatus });
  }
  if (!boundary.visualClosureDecisionId || boundary.visualClosureDecisionStatus !== 'confirmed') {
    issues.push({ id, rule: 'visual-closure-ai-decision' });
  } else if (!(authorities.get(boundary.visualClosureDecisionId)?.decisionDomains ?? []).includes('visual-closure')) {
    issues.push({ id, rule: 'visual-closure-decision-authority' });
  }
  if (!['clean', 'manual-approved'].includes(boundary.purityStatus)) {
    issues.push({ id, rule: 'boundary-purity', purityStatus: boundary.purityStatus });
  }
  if (boundary.purityStatus === 'manual-approved' && boundary.manualDecision !== 'accept-current-boundary') {
    issues.push({ id, rule: 'boundary-manual-decision' });
  }
  if ((boundary.layoutSlotNodeIds ?? []).includes(boundary.selectedExportNodeId)) {
    issues.push({ id, rule: 'layout-slot-export' });
  }
  const bounds = boundary.selectedBounds;
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!isHalfStep(bounds?.[key])) issues.push({ id, rule: 'half-step-grid', property: key, value: bounds?.[key] });
  }
  if (bounds?.width !== boundary.imageDisplaySize?.width || bounds?.height !== boundary.imageDisplaySize?.height) {
    issues.push({ id, rule: 'image-display-size' });
  }
}

function auditDecisionAuthority(decision, issues) {
  const id = decision.id;
  if (decision.aiDecisionRequired !== true) issues.push({ id, rule: 'ai-decision-required' });
  if (decision.decisionMaker !== 'ai') issues.push({ id, rule: 'decision-maker', decisionMaker: decision.decisionMaker });
  if (decision.aiDecisionStatus !== 'confirmed') {
    issues.push({ id, rule: 'decision-status', aiDecisionStatus: decision.aiDecisionStatus });
  }
  if (!decision.decisionPacketId) issues.push({ id, rule: 'decision-packet' });
  if ((decision.decisionDomains ?? []).includes('arkui-api') && (decision.documentEvidenceIds ?? []).length === 0) {
    issues.push({ id, rule: 'arkui-api-evidence' });
  }
  if (decision.decisionProvenance === 'cached-evidence-revalidated' && decision.contextDeltaChecked !== true) {
    issues.push({ id, rule: 'cached-evidence-context-check' });
  }
}

function readProjectFile(projectRoot, relativePath, cache) {
  if (!cache.has(relativePath)) cache.set(relativePath, readFileSync(resolve(projectRoot, relativePath), 'utf8'));
  return cache.get(relativePath);
}

function auditStringResource(decision, projectRoot, fileCache, jsonCache, issues) {
  const { id, resourceFile, resourceName, targetModule, value } = decision;
  const isValidModule = typeof targetModule === 'string' && targetModule.length > 0 &&
    !targetModule.startsWith('/') && !targetModule.split('/').includes('..');
  const moduleRoot = isValidModule ? targetModule.replace(/\/+$/, '') : '';
  if (!isValidModule) issues.push({ id, rule: 'string-resource-module', targetModule });
  if (typeof resourceFile !== 'string' || !/(^|\/)resources\/base\/element\/string\.json$/.test(resourceFile)) {
    issues.push({ id, rule: 'string-resource-file', resourceFile });
  } else if (isValidModule && resourceFile !== `${moduleRoot}/src/main/resources/base/element/string.json`) {
    issues.push({ id, rule: 'string-resource-module-file', targetModule, resourceFile });
  }
  if (typeof resourceName !== 'string' || !/^[a-z][a-z0-9_]*$/.test(resourceName)) {
    issues.push({ id, rule: 'string-resource-name', resourceName });
  }

  let resourceDocument;
  if (typeof resourceFile === 'string') {
    try {
      if (!jsonCache.has(resourceFile)) {
        jsonCache.set(resourceFile, JSON.parse(readProjectFile(projectRoot, resourceFile, fileCache)));
      }
      resourceDocument = jsonCache.get(resourceFile);
    } catch {
      issues.push({ id, rule: 'string-resource-json', resourceFile });
    }
  }

  const entries = resourceDocument?.string;
  if (resourceDocument !== undefined && !Array.isArray(entries)) {
    issues.push({ id, rule: 'string-resource-schema', resourceFile });
  } else if (Array.isArray(entries) && typeof resourceName === 'string') {
    const matches = entries.filter((entry) => entry?.name === resourceName);
    if (matches.length !== 1) {
      issues.push({ id, rule: 'string-resource-entry', resourceName, count: matches.length });
    } else if (matches[0].value !== value) {
      issues.push({ id, rule: 'string-resource-value', resourceName });
    }
  }

  if (!Array.isArray(decision.sourceFiles) || decision.sourceFiles.length === 0) {
    issues.push({ id, rule: 'string-resource-source-files' });
    return;
  }
  const referencePattern = typeof resourceName === 'string' ?
    new RegExp(`\\$r\\(\\s*['"]app\\.string\\.${escapePattern(resourceName)}['"]\\s*\\)`) : null;
  for (const sourceFile of decision.sourceFiles) {
    if (isValidModule && (typeof sourceFile !== 'string' || !sourceFile.startsWith(`${moduleRoot}/src/main/ets/`))) {
      issues.push({ id, rule: 'string-resource-source-module', sourceFile, targetModule });
    }
    try {
      const source = readProjectFile(projectRoot, sourceFile, fileCache);
      if (!referencePattern?.test(source)) issues.push({ id, rule: 'string-resource-reference', sourceFile, resourceName });
    } catch {
      issues.push({ id, rule: 'string-resource-source-file', sourceFile });
    }
  }
}

function auditTextContentCoverage(textContents, stringResources, issues) {
  const textContentById = new Map(textContents.map((content) => [content.id, content]));
  if (textContentById.size !== textContents.length) issues.push({ id: 'manifest', rule: 'text-content-ids' });
  const mappingCount = new Map();
  for (const decision of stringResources) {
    if (!Array.isArray(decision.textContentSpecIds) || decision.textContentSpecIds.length === 0) {
      issues.push({ id: decision.id, rule: 'string-resource-text-refs' });
      continue;
    }
    for (const textContentSpecId of decision.textContentSpecIds) {
      const content = textContentById.get(textContentSpecId);
      if (!content) {
        issues.push({ id: decision.id, rule: 'string-resource-text-ref', textContentSpecId });
        continue;
      }
      mappingCount.set(textContentSpecId, (mappingCount.get(textContentSpecId) ?? 0) + 1);
      if (content.value !== decision.value) {
        issues.push({ id: decision.id, rule: 'string-resource-text-value', textContentSpecId });
      }
    }
  }
  for (const content of textContents) {
    const count = mappingCount.get(content.id) ?? 0;
    if (!['design-static', 'runtime-dynamic', 'user-input'].includes(content.origin)) {
      issues.push({ id: content.id, rule: 'text-content-origin', origin: content.origin });
    }
    if (typeof content.value !== 'string') issues.push({ id: content.id, rule: 'text-content-value' });
    if (content.origin === 'design-static' && count !== 1) {
      issues.push({ id: content.id, rule: 'design-static-string-mapping', count });
    } else if (content.origin !== 'design-static' && count > 0) {
      issues.push({ id: content.id, rule: 'dynamic-string-mapping', origin: content.origin });
    }
  }
}

const options = parseArgs(process.argv.slice(2));
let manifest;
try {
  manifest = JSON.parse(readFileSync(options.manifest, 'utf8'));
} catch (error) {
  fail(`Unable to read the audit manifest: ${error instanceof Error ? error.message : String(error)}`);
}
if (!Array.isArray(manifest.requirements)) fail('Audit manifest is missing requirements[]');
if (!Array.isArray(manifest.resourceBoundaries)) fail('Audit manifest is missing resourceBoundaries[]');
if (!Array.isArray(manifest.decisionAuthorities)) fail('Audit manifest is missing decisionAuthorities[]');
if (!Array.isArray(manifest.layoutSpecs)) fail('Audit manifest is missing layoutSpecs[]; regenerate legacy manifests');
if (!Array.isArray(manifest.layoutBindings)) fail('Audit manifest is missing layoutBindings[]; regenerate legacy manifests');
if (!Array.isArray(manifest.textContents)) fail('Audit manifest is missing textContents[]; regenerate legacy manifests');
if (!Array.isArray(manifest.stringResources)) fail('Audit manifest is missing stringResources[]; regenerate legacy manifests');

const issues = [];
const fileCache = new Map();
const jsonCache = new Map();
const inlineTextAuditedFiles = new Set();
if (manifest.requirements.length > 0 && manifest.layoutSpecs.length === 0) {
  issues.push({ id: 'manifest', rule: 'layout-specs-empty', message: 'A manifest containing UI audit requirements must be regenerated from current layout analysis' });
}
if (manifest.layoutSpecs.length > 0 && manifest.layoutBindings.length === 0) {
  issues.push({ id: 'manifest', rule: 'layout-bindings-empty', message: 'Every layout fact requires an implementation binding' });
}
for (const decision of manifest.decisionAuthorities) auditDecisionAuthority(decision, issues);
const decisionAuthorities = new Map(manifest.decisionAuthorities.map((decision) => [decision.id, decision]));
for (const requirement of manifest.requirements) {
  if (!Array.isArray(requirement.decisionAuthorityIds) || requirement.decisionAuthorityIds.length === 0) {
    issues.push({ id: requirement.id, rule: 'decision-authority-refs' });
  } else {
    for (const decisionAuthorityId of requirement.decisionAuthorityIds) {
      if (!decisionAuthorities.has(decisionAuthorityId)) {
        issues.push({ id: requirement.id, rule: 'decision-authority-ref', decisionAuthorityId });
      }
    }
  }
  if (!Array.isArray(requirement.sourceFiles) || requirement.sourceFiles.length === 0) {
    issues.push({ id: requirement.id, rule: 'source-files', message: 'Missing sourceFiles' });
    continue;
  }
  const sources = [];
  for (const sourceFile of requirement.sourceFiles) {
    try {
      sources.push({ sourceFile, source: readProjectFile(options.projectRoot, sourceFile, fileCache) });
    } catch {
      issues.push({ id: requirement.id, rule: 'source-file', sourceFile, message: 'Unable to read source file' });
    }
  }
  const combinedSource = sources.map((entry) => entry.source).join('\n');
  for (const component of requirement.requiredComponents ?? []) {
    if (!hasComponent(combinedSource, component)) {
      issues.push({ id: requirement.id, rule: 'required-component', component });
    }
  }
  for (const interaction of requirement.requiredInteractions ?? []) {
    if (!hasInteraction(combinedSource, interaction)) {
      issues.push({ id: requirement.id, rule: 'required-interaction', interaction });
    }
  }
  const presentationApi = requirement.requiredPresentationApi;
  if (!['bindSheet', 'bindPopup', 'none'].includes(presentationApi)) {
    issues.push({ id: requirement.id, rule: 'presentation-api-contract', presentationApi });
  } else if (!hasPresentationApi(combinedSource, presentationApi)) {
    issues.push({ id: requirement.id, rule: 'required-presentation-api', presentationApi });
  }
  if (presentationApi === 'bindPopup' &&
    (!Array.isArray(requirement.requiredBindingHostSourceNodeIds) || requirement.requiredBindingHostSourceNodeIds.length === 0)) {
    issues.push({ id: requirement.id, rule: 'popup-binding-host-evidence' });
  }
  if (requirement.requireForEach === true && !/\b(?:ForEach|LazyForEach|Repeat)\s*\(/.test(combinedSource)) {
    issues.push({ id: requirement.id, rule: 'foreach' });
  }
  for (const entry of sources) {
    if (!inlineTextAuditedFiles.has(entry.sourceFile)) {
      inlineTextAuditedFiles.add(entry.sourceFile);
      for (const line of findInlineTextLiterals(entry.source)) {
        issues.push({ id: entry.sourceFile, rule: 'inline-static-text', sourceFile: entry.sourceFile, line });
      }
    }
    if (requirement.forbidTextGlyphFallback === true) {
      for (const line of findTextGlyphFallbacks(entry.source)) {
        issues.push({ id: requirement.id, rule: 'text-glyph-fallback', sourceFile: entry.sourceFile, line });
      }
    }
    if (requirement.forbidFixedBlank === true) {
      for (const line of findFixedBlanks(entry.source)) {
        issues.push({ id: requirement.id, rule: 'fixed-blank', sourceFile: entry.sourceFile, line });
      }
    }
  }
}

auditTextContentCoverage(manifest.textContents, manifest.stringResources, issues);
for (const decision of manifest.stringResources) {
  auditStringResource(decision, options.projectRoot, fileCache, jsonCache, issues);
}
for (const boundary of manifest.resourceBoundaries) auditResourceBoundary(boundary, decisionAuthorities, issues);
issues.push(...validateLayoutConstraints(manifest.layoutSpecs, manifest.layoutBindings).issues);

const result = { passed: issues.length === 0, issueCount: issues.length, issues };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (issues.length > 0) process.exitCode = 1;
