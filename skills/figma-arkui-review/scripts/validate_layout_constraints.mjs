#!/usr/bin/env node

const RELATIONS = new Set(['packed-fixed-gap', 'space-between', 'flex-remainder', 'scroll-fixed-gap', 'grid-fixed-gap', 'overlay']);

function pushIssue(issues, id, rule, extra = {}) {
  issues.push({ id, rule, ...extra });
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[\s_-]/g, '');
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function fixedSize(child) {
  return isNumber(child.basis) ? child.basis : (isNumber(child.minSize) ? child.minSize : 0);
}

function auditLayout(layout, issues) {
  const id = layout.layoutId ?? 'unknown-layout';
  if (!RELATIONS.has(layout.relation)) pushIssue(issues, id, 'relation');
  if (!Array.isArray(layout.evidence) || layout.evidence.length === 0) pushIssue(issues, id, 'evidence');
  if (!Array.isArray(layout.children)) pushIssue(issues, id, 'children');
  if (!Array.isArray(layout.responsiveTests) || layout.responsiveTests.length === 0) pushIssue(issues, id, 'responsive-tests');
  if (layout.relation === 'space-between') auditSpaceBetween(layout, issues);
  if (layout.relation === 'flex-remainder') auditFlexRemainder(layout, issues);
  if (layout.relation === 'scroll-fixed-gap') auditScrollFixedGap(layout, issues);
  if (layout.relation !== 'overlay') auditDistanceOwnership(layout, issues);
  auditResponsiveMath(layout, issues);
}

function auditSpaceBetween(layout, issues) {
  const legal = (layout.evidence ?? []).some((evidence) => {
    const value = normalize(`${evidence.property}:${evidence.value}`);
    return evidence.kind === 'figma-auto-layout' && value.includes('spacebetween') ||
      evidence.kind === 'design-context' && value.includes('justify') && value.includes('spacebetween') ||
      evidence.kind === 'multi-size-geometry';
  });
  if (!legal) pushIssue(issues, layout.layoutId, 'space-between-evidence');
}

function auditFlexRemainder(layout, issues) {
  const flexChildren = (layout.children ?? []).filter((child) => child.role === 'flex' && child.grow > 0);
  if (flexChildren.length === 0) pushIssue(issues, layout.layoutId, 'flex-child');
  for (const child of layout.children ?? []) {
    if (child.role !== 'flex' && child.grow > 0) pushIssue(issues, layout.layoutId, 'grow-on-non-flex', { childId: child.childId });
  }
}

function auditScrollFixedGap(layout, issues) {
  if (!isNumber(layout.gap)) pushIssue(issues, layout.layoutId, 'scroll-gap');
  if (layout.scrolling !== true) pushIssue(issues, layout.layoutId, 'scrolling');
  for (const child of layout.children ?? []) {
    if (child.role !== 'scroll-item') pushIssue(issues, layout.layoutId, 'scroll-item-role', { childId: child.childId });
    if (!isNumber(child.basis) || child.minSize !== child.basis || child.maxSize !== child.basis) {
      pushIssue(issues, layout.layoutId, 'scroll-fixed-size', { childId: child.childId });
    }
    if (child.allowShrink !== false) pushIssue(issues, layout.layoutId, 'scroll-item-shrink', { childId: child.childId });
  }
}

function auditDistanceOwnership(layout, issues) {
  if (!layout.gap) return;
  for (const child of layout.children ?? []) {
    if ((child.marginBefore ?? 0) !== 0 || (child.marginAfter ?? 0) !== 0) {
      pushIssue(issues, layout.layoutId, 'gap-margin-duplicate', { childId: child.childId });
    }
  }
}

function auditResponsiveMath(layout, issues) {
  if (layout.relation === 'overlay' || layout.relation === 'scroll-fixed-gap') return;
  const tests = layout.responsiveTests ?? [];
  const padding = layout.container?.padding ?? {};
  const children = layout.children ?? [];
  const gap = isNumber(layout.gap) ? layout.gap : 0;
  const fixed = children
    .filter((child) => child.role !== 'flex')
    .reduce((sum, child) => sum + fixedSize(child) + (child.marginBefore ?? 0) + (child.marginAfter ?? 0), 0);
  const flexMin = children
    .filter((child) => child.role === 'flex')
    .reduce((sum, child) => sum + (child.minSize ?? 0), 0);
  for (const width of tests) {
    const available = width - (padding.before ?? 0) - (padding.after ?? 0) - fixed - flexMin - Math.max(0, children.length - 1) * gap;
    if (available < 0) pushIssue(issues, layout.layoutId, 'negative-flex-remainder', { width, available });
  }
}

function auditBinding(binding, layouts, issues) {
  const layout = layouts.get(binding.layoutId);
  if (!layout) {
    pushIssue(issues, binding.layoutBindingId ?? 'unknown-binding', 'layout-ref', { layoutId: binding.layoutId });
    return;
  }
  if (normalize(binding.arkuiStrategy) !== normalize(layout.relation)) {
    pushIssue(issues, binding.layoutBindingId, 'arkui-strategy', { expected: layout.relation, actual: binding.arkuiStrategy });
  }
  for (const propertyBinding of binding.propertyBindings ?? []) {
    const resolved = resolveFact(layout, propertyBinding.factPath);
    if (resolved.found !== true) {
      pushIssue(issues, binding.layoutBindingId, 'fact-ref', { factPath: propertyBinding.factPath });
    } else if (!sameValue(resolved.value, propertyBinding.value)) {
      pushIssue(issues, binding.layoutBindingId, 'fact-value', {
        factPath: propertyBinding.factPath,
        expected: resolved.value,
        actual: propertyBinding.value
      });
    }
    for (const forbidden of binding.forbiddenProperties ?? []) {
      const signature = normalize(`${propertyBinding.target}.${propertyBinding.property}:${propertyBinding.value}`);
      if (signature.includes(normalize(forbidden))) {
        pushIssue(issues, binding.layoutBindingId, 'forbidden-property', { forbidden });
      }
    }
  }
}

function sameValue(expected, actual) {
  return expected === actual || normalize(expected) === normalize(actual);
}

function resolveFact(layout, path) {
  if (!path) return { found: false };
  if (path.startsWith('children[')) {
    const match = /^children\[([^\]]+)\]\.(.+)$/.exec(path);
    const child = (layout.children ?? []).find((entry) => entry.childId === match?.[1]);
    return resolvePath(child, match?.[2]);
  }
  return resolvePath(layout, path);
}

function resolvePath(root, path) {
  if (!root || !path) return { found: false };
  let current = root;
  for (const part of path.split('.')) {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) current = current[part];
    else return { found: false };
  }
  return { found: true, value: current };
}

export function validateLayoutConstraints(layoutSpecs, layoutBindings) {
  const issues = [];
  const layouts = new Map();
  for (const layout of layoutSpecs ?? []) {
    layouts.set(layout.layoutId, layout);
    auditLayout(layout, issues);
  }
  for (const binding of layoutBindings ?? []) auditBinding(binding, layouts, issues);
  for (const layoutId of layouts.keys()) {
    if (!(layoutBindings ?? []).some((binding) => binding.layoutId === layoutId)) pushIssue(issues, layoutId, 'missing-layout-binding');
  }
  return { passed: issues.length === 0, issues };
}
