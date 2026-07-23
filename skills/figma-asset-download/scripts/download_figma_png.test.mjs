import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExportApiUrl,
  parseFigmaUrl,
  validateBoundaryDecision,
  validatePngPixelSize
} from './download_figma_png.mjs';

function decision(overrides = {}) {
  return {
    boundaryDecisionId: 'boundary-image',
    figmaNodeUrl: 'https://www.figma.com/design/AbC123/Example?node-id=12-34',
    layoutSlotNodeIds: ['12:30'],
    selectedExportNodeId: '12:34',
    selectedBounds: { x: 0.5, y: 1.5, width: 15.5, height: 15.5 },
    imageDisplaySize: { width: 15.5, height: 15.5 },
    visualClosureDecisionId: 'visual-closure-image',
    visualClosureDecisionStatus: 'confirmed',
    purityStatus: 'clean',
    decisionStatus: 'resolved',
    ...overrides
  };
}

test('parses a design URL and converts node-id', () => {
  const parsed = parseFigmaUrl('https://www.figma.com/design/AbC123/Example?node-id=12-34&t=ignored');
  assert.deepEqual(parsed, { fileKey: 'AbC123', nodeId: '12:34' });
});

test('refuses to guess a node when node-id is missing', () => {
  assert.throws(() => parseFigmaUrl('https://www.figma.com/design/AbC123/Example'), /missing node-id/i);
});

test('rejects a non-design URL', () => {
  assert.throws(() => parseFigmaUrl('https://www.figma.com/file/AbC123/Example?node-id=12-34'), /parse.*\/design/i);
});

test('accepts only resolved boundaries with matching dimensions', () => {
  assert.deepEqual(validateBoundaryDecision(decision()), { fileKey: 'AbC123', nodeId: '12:34' });
  assert.throws(() => validateBoundaryDecision(decision({ decisionStatus: 'manual-review' })), /unresolved/i);
  assert.throws(() => validateBoundaryDecision(decision({ visualClosureDecisionId: '' })), /visual-closure/i);
  assert.throws(() => validateBoundaryDecision(decision({ imageDisplaySize: { width: 16, height: 16 } })), /do not match/i);
  assert.throws(() => validateBoundaryDecision(decision({ purityStatus: 'manual-approved' })), /lacks an explicit decision/i);
  assert.deepEqual(
    validateBoundaryDecision(decision({ purityStatus: 'manual-approved', manualDecision: 'accept-current-boundary' })),
    { fileKey: 'AbC123', nodeId: '12:34' }
  );
});

test('uses the nearest instance URL for inherited export identifiers', () => {
  const inheritedDecision = decision({ selectedExportNodeId: 'I12:34;56:78' });
  assert.deepEqual(validateBoundaryDecision(inheritedDecision), { fileKey: 'AbC123', nodeId: 'I12:34;56:78' });
});

test('requires exact 3x pixels for integers and adjacent pixels for half steps', () => {
  assert.equal(validatePngPixelSize(16, 48), true);
  assert.equal(validatePngPixelSize(16, 47), false);
  assert.equal(validatePngPixelSize(15.5, 46), true);
  assert.equal(validatePngPixelSize(15.5, 47), true);
  assert.equal(validatePngPixelSize(15.5, 48), false);
});

test('uses fixed export-boundary request parameters', () => {
  const url = new URL(buildExportApiUrl('AbC123', '12:34'));
  assert.equal(url.searchParams.get('ids'), '12:34');
  assert.equal(url.searchParams.get('format'), 'png');
  assert.equal(url.searchParams.get('scale'), '3');
  assert.equal(url.searchParams.get('contents_only'), 'true');
  assert.equal(url.searchParams.get('use_absolute_bounds'), 'true');
});
