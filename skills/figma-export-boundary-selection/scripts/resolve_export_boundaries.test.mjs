import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveExportBoundaries } from './resolve_export_boundaries.mjs';

const figmaUrl = 'https://www.figma.com/design/AbC123/Example?node-id=1-1';

function node(id, name, type, x, y, width, height, children = [], extra = {}) {
  return {
    id, name, type, absoluteBoundingBox: { x, y, width, height },
    absoluteRenderBounds: { x, y, width, height }, children, ...extra
  };
}

function resource(overrides = {}) {
  return {
    boundaryDecisionId: 'boundary-image',
    resourceDecisionId: 'resource-image',
    resourceName: 'image',
    figmaUrl,
    layoutSlotNodeIds: ['1:1'],
    visualSeedNodeIds: ['1:2'],
    requiredVisualNodeIds: ['1:2'],
    boundarySearchRootNodeId: '1:1',
    decisionPacketId: 'packet-image',
    visualClosureDecisionId: 'visual-closure-image',
    visualClosureDecisionStatus: 'confirmed',
    visualClosureDecisionProvenance: 'fresh-ai-review',
    ...overrides
  };
}

function response(root) {
  return { nodes: { [root.id]: { document: root } } };
}

test('selects a 16x16 inner image from a 135x30 layout slot', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 10, 7, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 135, 30, [image]);
  const result = await resolveExportBoundaries({ resources: [resource()] }, response(root));
  assert.equal(result.canDownload, true);
  assert.equal(result.decisions[0].selectedExportNodeId, '1:2');
  assert.deepEqual(result.decisions[0].imageDisplaySize, { width: 16, height: 16 });
});

test('prevents geometry from resolving a missing AI visual-closure decision', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 10, 7, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 135, 30, [image]);
  const manifest = { resources: [resource({ visualClosureDecisionId: '', visualClosureDecisionStatus: 'unresolved' })] };
  const result = await resolveExportBoundaries(manifest, response(root));
  assert.equal(result.canDownload, false);
  assert.equal(result.decisions[0].decisionStatus, 'unresolved');
  assert.match(result.manualReview[0].problem, /not yet confirmed/i);
});

test('selects the 20x20 smallest common container for an image and glow', async () => {
  const image = node('1:3', 'Image content', 'RECTANGLE', 2.5, 2.5, 15, 15, [], { fills: [{ type: 'IMAGE' }] });
  const glow = node('1:4', 'Glow', 'ELLIPSE', 0, 0, 20, 20, [], { fills: [{ type: 'GRADIENT_RADIAL' }] });
  const wrapper = node('1:2', 'Image', 'FRAME', 0, 0, 20, 20, [image, glow]);
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 135, 30, [wrapper]);
  const manifest = { resources: [resource({ visualSeedNodeIds: ['1:3', '1:4'], requiredVisualNodeIds: ['1:3', '1:4'] })] };
  const result = await resolveExportBoundaries(manifest, response(root));
  assert.equal(result.decisions[0].selectedExportNodeId, '1:2');
  assert.deepEqual(result.decisions[0].imageDisplaySize, { width: 20, height: 20 });
});

test('passes a valid half-pixel boundary', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 0.5, 1.5, 15.5, 15.5, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 20, 20, [image]);
  const result = await resolveExportBoundaries({ resources: [resource()] }, response(root));
  assert.equal(result.decisions[0].decisionStatus, 'resolved');
  assert.deepEqual(result.decisions[0].selectedBounds, { x: 0.5, y: 1.5, width: 15.5, height: 15.5 });
});

test('adds a non-half-pixel coordinate to the problem manifest', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 1.38, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 20, 20, [image]);
  const result = await resolveExportBoundaries({ resources: [resource()] }, response(root));
  assert.equal(result.canDownload, false);
  assert.equal(result.decisions[0].decisionStatus, 'unresolved');
  assert.match(result.manualReview[0].problem, /neither integers nor \.5/i);
});

test('ignores unrelated outer text for an independent inner image', async () => {
  const image = node('1:3', 'Image', 'RECTANGLE', 0, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const text = node('1:4', 'Copy', 'TEXT', 20, 0, 40, 16, [], { characters: 'Description' });
  const wrapper = node('1:2', 'Mixed container', 'FRAME', 0, 0, 60, 16, [image, text]);
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 60, 16, [wrapper]);
  const manifest = { resources: [resource({ visualSeedNodeIds: ['1:3', '1:4'], requiredVisualNodeIds: ['1:3'] })] };
  const result = await resolveExportBoundaries(manifest, response(root));
  assert.equal(result.decisions[0].selectedExportNodeId, '1:3');
  assert.equal(result.decisions[0].decisionStatus, 'resolved');
});

test('sends a required common container with extra text to manual review', async () => {
  const image = node('1:3', 'Image', 'RECTANGLE', 0, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const glow = node('1:4', 'Glow', 'ELLIPSE', 0, 0, 20, 20, [], { fills: [{ type: 'GRADIENT_RADIAL' }] });
  const text = node('1:5', 'Copy', 'TEXT', 20, 0, 40, 16, [], { characters: 'Description' });
  const wrapper = node('1:2', 'Mixed container', 'FRAME', 0, 0, 60, 20, [image, glow, text]);
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 60, 20, [wrapper]);
  const manifest = { resources: [resource({ visualSeedNodeIds: ['1:3', '1:4'], requiredVisualNodeIds: ['1:3', '1:4'] })] };
  const result = await resolveExportBoundaries(manifest, response(root));
  assert.equal(result.decisions[0].decisionStatus, 'manual-review');
  assert.equal(result.manualReview.length, 1);
  assert.match(result.manualReview[0].figmaNodeUrl, /node-id=1-2/);
});

test('blocks export when the common container is the layout slot', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 0, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const glow = node('1:3', 'Glow', 'ELLIPSE', 0, 0, 20, 20, [], { fills: [{ type: 'GRADIENT_RADIAL' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 135, 30, [image, glow]);
  const manifest = { resources: [resource({ visualSeedNodeIds: ['1:2', '1:3'], requiredVisualNodeIds: ['1:2', '1:3'] })] };
  const result = await resolveExportBoundaries(manifest, response(root));
  assert.equal(result.decisions[0].decisionStatus, 'unresolved');
  assert.match(result.manualReview[0].problem, /layout or hit-target region/i);
});

test('aggregates all boundary problems once', async () => {
  const invalid = node('1:2', 'Invalid image', 'RECTANGLE', 1.38, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const firstRoot = node('1:1', 'First layout slot', 'FRAME', 0, 0, 20, 20, [invalid]);
  const secondRoot = node('2:1', 'Second layout slot', 'FRAME', 0, 0, 20, 20, []);
  const secondResource = resource({
    boundaryDecisionId: 'boundary-missing',
    resourceDecisionId: 'resource-missing',
    resourceName: 'missing_image',
    layoutSlotNodeIds: ['2:1'],
    visualSeedNodeIds: ['2:2'],
    requiredVisualNodeIds: ['2:2'],
    boundarySearchRootNodeId: '2:1'
  });
  const nodeData = { nodes: { '1:1': { document: firstRoot }, '2:1': { document: secondRoot } } };
  const result = await resolveExportBoundaries({ resources: [resource(), secondResource] }, nodeData);
  assert.equal(result.canDownload, false);
  assert.equal(result.manualReview.length, 2);
  assert.deepEqual(result.manualReview.map((entry) => entry.resourceName), ['image', 'missing_image']);
});

test('links an inherited-node problem to the nearest openable instance', async () => {
  const inherited = node('I1:1;2:2', 'Image inside instance', 'RECTANGLE', 1.38, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Instance', 'INSTANCE', 0, 0, 20, 20, [inherited]);
  const inheritedResource = resource({
    visualSeedNodeIds: ['I1:1;2:2'],
    requiredVisualNodeIds: ['I1:1;2:2']
  });
  const result = await resolveExportBoundaries({ resources: [inheritedResource] }, response(root));
  assert.match(result.manualReview[0].figmaNodeUrl, /node-id=1-1/);
  assert.doesNotMatch(result.manualReview[0].figmaNodeUrl, /I1/);
});

test('does not let an explicit skip block other resource downloads', async () => {
  const image = node('1:2', 'Image', 'RECTANGLE', 0, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 20, 20, [image]);
  const skipped = resource({
    boundaryDecisionId: 'boundary-skipped',
    resourceDecisionId: 'resource-skipped',
    resourceName: 'skipped_image',
    manualDecision: 'skip-resource'
  });
  const result = await resolveExportBoundaries({ resources: [resource(), skipped] }, response(root));
  assert.equal(result.decisions[1].decisionStatus, 'skipped');
  assert.equal(result.canDownload, true);
});

test('turns a manually accepted contaminated candidate into a resolved boundary', async () => {
  const image = node('1:3', 'Image', 'RECTANGLE', 0, 0, 16, 16, [], { fills: [{ type: 'IMAGE' }] });
  const glow = node('1:4', 'Glow', 'ELLIPSE', 0, 0, 20, 20, [], { fills: [{ type: 'GRADIENT_RADIAL' }] });
  const background = node('1:5', 'Background', 'RECTANGLE', 0, 0, 20, 20, [], { fills: [{ type: 'SOLID' }] });
  const wrapper = node('1:2', 'Candidate boundary', 'FRAME', 0, 0, 20, 20, [image, glow, background]);
  const root = node('1:1', 'Layout slot', 'FRAME', 0, 0, 30, 30, [wrapper]);
  const approved = resource({
    visualSeedNodeIds: ['1:3', '1:4'],
    requiredVisualNodeIds: ['1:3', '1:4'],
    manualDecision: 'accept-current-boundary',
    approvedExportNodeId: '1:2'
  });
  const result = await resolveExportBoundaries({ resources: [approved] }, response(root));
  assert.equal(result.decisions[0].decisionStatus, 'resolved');
  assert.equal(result.decisions[0].purityStatus, 'manual-approved');
  assert.equal(result.canDownload, true);
});
