import assert from 'node:assert/strict';
import test from 'node:test';
import { routeNodeDigests } from './route_node_digests.mjs';

function listItem(nodeId, name, completeness = 'metadata', variantKey = '') {
  return {
    nodeId,
    name,
    type: 'INSTANCE',
    componentKey: 'package-card',
    variantKey,
    layoutMode: 'VERTICAL',
    childNodeIds: [],
    width: 97,
    height: 114,
    semanticSignals: ['SelectableCollectionItem'],
    interactionSignals: ['select'],
    visualSignals: [],
    unknownFields: [],
    evidenceCompleteness: completeness,
    completionSource: 'none'
  };
}

test('reads only one representative for repeated components initially', () => {
  const nodeFacts = [listItem('1:1', 'One month'), listItem('1:2', 'Three months'), listItem('1:3', 'Twelve months')];
  const result = routeNodeDigests({
    fileKey: 'AbC123',
    fileVersion: '42',
    targetNodeIds: nodeFacts.map((node) => node.nodeId),
    nodeFacts
  });
  assert.equal(result.nodeDigest.length, 1);
  assert.equal(result.nodeDigest[0].route, 'semantic');
  assert.equal(result.nodeDigest[0].routingRisk, 'medium');
  assert.equal(result.nodeDigest[0].aiDecisionRequired, true);
  assert.equal(result.nodeDigest[0].aiReviewPolicy, 'fresh-review');
  assert.deepEqual(result.initialContextNodeIds, ['1:1']);
  assert.equal(result.routingSummary.avoidedInitialContextReads, 2);
  assert.equal(result.nodeDigest[0].cacheScope, 'persistent');
});

test('routes a complete simple image to Fast with zero deep reads', () => {
  const image = {
    nodeId: '2:1', name: 'Visual asset', type: 'RECTANGLE', childNodeIds: [], width: 56, height: 28,
    semanticSignals: [], interactionSignals: [], visualSignals: ['IMAGE'], unknownFields: [],
    evidenceCompleteness: 'complete', completionSource: 'versioned-cache'
  };
  const result = routeNodeDigests({ fileKey: 'AbC123', fileVersion: '42', targetNodeIds: ['2:1'], nodeFacts: [image] });
  assert.equal(result.nodeDigest[0].route, 'fast');
  assert.equal(result.nodeDigest[0].readPolicy, 'metadata-only');
  assert.deepEqual(result.initialContextNodeIds, []);
  assert.equal(result.nodeDigest[0].cacheScope, 'persistent');
  assert.equal(result.nodeDigest[0].aiReviewPolicy, 'cached-evidence-revalidation');
});

test('routes masks and unknown fields to staged Deep reads', () => {
  const image = {
    nodeId: '3:1', name: 'Masked image', type: 'FRAME', childNodeIds: [], width: 20, height: 20,
    semanticSignals: [], interactionSignals: [], visualSignals: ['MASK', 'MULTI_LAYER'],
    unknownFields: ['maskScope'], evidenceCompleteness: 'context'
  };
  const result = routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['3:1'], nodeFacts: [image] });
  assert.equal(result.nodeDigest[0].route, 'deep');
  assert.equal(result.nodeDigest[0].readPolicy, 'staged-context');
  assert.match(result.nodeDigest[0].expandWhen.join(' '), /visual closure/i);
});

test('does not skip deep reads for complete facts without a trusted source', () => {
  const image = {
    nodeId: '3:2', name: 'Unverified image', type: 'RECTANGLE', childNodeIds: [], width: 20, height: 20,
    semanticSignals: [], interactionSignals: [], visualSignals: ['IMAGE'], unknownFields: [],
    evidenceCompleteness: 'complete', completionSource: 'none'
  };
  const result = routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['3:2'], nodeFacts: [image] });
  assert.equal(result.nodeDigest[0].route, 'fast');
  assert.equal(result.nodeDigest[0].readPolicy, 'representative-context');
});

test('does not skip deep reads for versioned-cache without fileVersion', () => {
  const image = {
    nodeId: '3:3', name: 'Potentially stale image', type: 'RECTANGLE', childNodeIds: [], width: 20, height: 20,
    semanticSignals: [], interactionSignals: [], visualSignals: ['IMAGE'], unknownFields: [],
    evidenceCompleteness: 'complete', completionSource: 'versioned-cache'
  };
  const result = routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['3:3'], nodeFacts: [image] });
  assert.equal(result.nodeDigest[0].readPolicy, 'representative-context');
  assert.equal(result.nodeDigest[0].aiReviewPolicy, 'fresh-review');
});

test('preserves structural deduplication across name, dimension, and copy differences', () => {
  const first = { ...listItem('4:1', 'One month'), contentFingerprint: 'text-a', assetIdentity: 'image-a' };
  const second = { ...listItem('4:2', 'Twelve months'), width: 120, height: 140, contentFingerprint: 'text-b', assetIdentity: 'image-b' };
  const result = routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['4:1', '4:2'], nodeFacts: [first, second] });
  assert.equal(result.nodeDigest.length, 1);
  assert.equal(result.nodeDigest[0].instanceDeltas[1].width, 120);
  assert.deepEqual(
    result.nodeDigest[0].perInstanceEvidenceRequired,
    ['name', 'width', 'height', 'contentFingerprint', 'assetIdentity']
  );
});

test('does not share structural conclusions across different variants', () => {
  const selected = listItem('5:1', 'Selected', 'metadata', 'selected=true');
  const normal = listItem('5:2', 'Unselected', 'metadata', 'selected=false');
  const result = routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['5:1', '5:2'], nodeFacts: [selected, normal] });
  assert.equal(result.nodeDigest.length, 2);
});

test('rejects missing target nodes and cyclic subtrees', () => {
  assert.throws(
    () => routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['missing'], nodeFacts: [listItem('6:1', 'Present')] }),
    /missing node/i
  );
  const cyclic = listItem('6:2', 'Cycle');
  cyclic.childNodeIds = ['6:2'];
  assert.throws(
    () => routeNodeDigests({ fileKey: 'AbC123', targetNodeIds: ['6:2'], nodeFacts: [cyclic] }),
    /cycle/i
  );
});
