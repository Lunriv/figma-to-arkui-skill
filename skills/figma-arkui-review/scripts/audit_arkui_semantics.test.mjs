#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const auditScript = resolve(projectRoot, 'skills/figma-arkui-review/scripts/audit_arkui_semantics.mjs');

function runAudit(manifest) {
  const result = spawnSync(process.execPath, [auditScript, '--project-root', projectRoot, '--manifest', resolve(projectRoot, manifest)], { encoding: 'utf8' });
  return { status: result.status, report: JSON.parse(result.stdout) };
}

function runModifiedValidAudit(context, updateManifest) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'arkui-string-audit-'));
  context.after(() => rmSync(temporaryDirectory, { recursive: true, force: true }));
  const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'examples/semantic-page-audit/audit-valid.json'), 'utf8'));
  updateManifest(manifest);
  const manifestPath = join(temporaryDirectory, 'audit.json');
  writeFileSync(manifestPath, JSON.stringify(manifest));
  return runAudit(manifestPath);
}

test('passes when string resources are mapped completely', () => {
  const result = runAudit('examples/semantic-page-audit/audit-valid.json');
  assert.equal(result.status, 0);
  assert.equal(result.report.passed, true);
});

test('blocks inline static text and missing resource references', () => {
  const result = runAudit('examples/semantic-page-audit/audit-invalid.json');
  const rules = new Set(result.report.issues.map((issue) => issue.rule));
  assert.equal(result.status, 1);
  assert.ok(rules.has('inline-static-text'));
  assert.ok(rules.has('string-resource-reference'));
});

test('blocks an omitted design-static text mapping', (context) => {
  const result = runModifiedValidAudit(context, (manifest) => manifest.stringResources.pop());
  assert.equal(result.status, 1);
  assert.ok(result.report.issues.some((issue) => issue.rule === 'design-static-string-mapping'));
});

test('blocks a string resource written to a non-owning module', (context) => {
  const result = runModifiedValidAudit(context, (manifest) => {
    manifest.stringResources[0].targetModule = 'other-module';
  });
  assert.equal(result.status, 1);
  assert.ok(result.report.issues.some((issue) => issue.rule === 'string-resource-module-file'));
  assert.ok(result.report.issues.some((issue) => issue.rule === 'string-resource-source-module'));
});

test('blocks a missing planned overlay API', (context) => {
  const result = runModifiedValidAudit(context, (manifest) => {
    manifest.requirements[0].requiredPresentationApi = 'bindSheet';
  });
  assert.equal(result.status, 1);
  assert.ok(result.report.issues.some((issue) => issue.rule === 'required-presentation-api'));
});

test('blocks a popup without anchor evidence', (context) => {
  const result = runModifiedValidAudit(context, (manifest) => {
    manifest.requirements[0].requiredPresentationApi = 'bindPopup';
    manifest.requirements[0].requiredBindingHostSourceNodeIds = [];
  });
  assert.equal(result.status, 1);
  assert.ok(result.report.issues.some((issue) => issue.rule === 'popup-binding-host-evidence'));
});
