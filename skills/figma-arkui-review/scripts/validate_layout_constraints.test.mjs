#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateLayoutConstraints } from './validate_layout_constraints.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../../examples/responsive-layout/layout-constraints.json', import.meta.url), 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rules(result) {
  return result.issues.map((issue) => issue.rule);
}

test('passes a genuine fixed gap', () => {
  const result = validateLayoutConstraints(fixture.layoutSpecs, fixture.layoutBindings);
  assert.equal(result.passed, true);
});

test('rejects SpaceBetween inferred from equal spacing in one state', () => {
  const current = clone(fixture);
  current.layoutSpecs[0].relation = 'space-between';
  current.layoutSpecs[0].evidence = [{ evidenceId: 'single', kind: 'single-state-bounds', property: 'bounds', value: 'equidistant' }];
  current.layoutBindings[0].arkuiStrategy = 'space-between';
  const result = validateLayoutConstraints(current.layoutSpecs, current.layoutBindings);
  assert.ok(rules(result).includes('space-between-evidence'));
});

test('passes an explicit Figma SPACE_BETWEEN relationship', () => {
  const current = clone(fixture);
  const layout = current.layoutSpecs[0];
  layout.relation = 'space-between';
  layout.scrolling = false;
  layout.evidence = [{ evidenceId: 'auto', kind: 'figma-auto-layout', property: 'primaryAxisAlignItems', value: 'SPACE_BETWEEN' }];
  current.layoutBindings[0].arkuiStrategy = 'space-between';
  current.layoutBindings[0].propertyBindings = [{ target: 'Row', property: 'justifyContent', value: 'SpaceBetween', factPath: 'relation' }];
  current.layoutBindings[0].forbiddenProperties = [];
  const result = validateLayoutConstraints([layout], [current.layoutBindings[0]]);
  assert.equal(result.passed, true);
});

test('passes navigation with fixed sides and a flexible center', () => {
  const current = clone(fixture);
  const result = validateLayoutConstraints([current.layoutSpecs[1]], [current.layoutBindings[1]]);
  assert.equal(result.passed, true);
});

test('fails when navigation is changed to SpaceBetween', () => {
  const current = clone(fixture);
  current.layoutBindings[1].arkuiStrategy = 'space-between';
  const result = validateLayoutConstraints([current.layoutSpecs[1]], [current.layoutBindings[1]]);
  assert.ok(rules(result).includes('arkui-strategy'));
});

test('fails when space and margin encode the same distance', () => {
  const current = clone(fixture);
  current.layoutSpecs[3].children[1].marginBefore = 6;
  const result = validateLayoutConstraints(current.layoutSpecs, current.layoutBindings);
  assert.ok(rules(result).includes('gap-margin-duplicate'));
});

test('fails when a horizontal list shrinks fixed items', () => {
  const current = clone(fixture);
  current.layoutSpecs[3].children[1].allowShrink = true;
  const result = validateLayoutConstraints(current.layoutSpecs, current.layoutBindings);
  assert.ok(rules(result).includes('scroll-item-shrink'));
});

test('fails on a negative flex remainder at 320 vp', () => {
  const current = clone(fixture);
  current.layoutSpecs[4].children[1].minSize = 260;
  const result = validateLayoutConstraints(current.layoutSpecs, current.layoutBindings);
  assert.ok(rules(result).includes('negative-flex-remainder'));
});

test('fails when layoutBinding lacks a fact reference', () => {
  const current = clone(fixture);
  current.layoutBindings[4].propertyBindings[0].factPath = 'children[label].grow';
  const result = validateLayoutConstraints(current.layoutSpecs, current.layoutBindings);
  assert.ok(rules(result).includes('fact-value'));
});
