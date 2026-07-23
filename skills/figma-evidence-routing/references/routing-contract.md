# Evidence Routing Contract

## Input

`nodeFacts[]` retains only fields required for routing. It carries no reference code, raw REST payloads, or long text.

```text
{
  fileKey,
  fileVersion,
  rootNodeIds,
  targetNodeIds,
  nodeFacts: [{
    nodeId,
    parentNodeId,
    name,
    type,
    childNodeIds,
    componentKey,
    variantKey,
    layoutMode,
    width,
    height,
    semanticSignals,
    interactionSignals,
    visualSignals,
    styleTokenIds,
    contentFingerprint,
    variableFingerprint,
    assetIdentity,
    unknownFields,
    evidenceCompleteness: "metadata | context | complete",
    completionSource: "none | code-connect | versioned-cache | same-request-context"
  }]
}
```

`targetNodeIds` contains only semantic blocks, component instances, variants, representative collection items, input regions, and resource candidates. Decorative leaves may remain in `nodeFacts` to contribute to parent structural fingerprints, but they do not receive separate digests.

## Output

```text
nodeDigest[] = [{
  digestId,
  structuralFingerprint,
  representativeNodeId,
  sourceNodeIds,
  route: "fast | semantic | deep",
  routingRisk: "low | medium | high",
  aiDecisionRequired: true,
  aiReviewPolicy: "fresh-review | cached-evidence-revalidation",
  readPolicy: "metadata-only | representative-context | staged-context",
  initialContextNodeIds,
  reuseNodeIds,
  expandWhen,
  cacheScope: "persistent | request",
  cacheKey,
  sharedFacts,
  instanceDeltas,
  perInstanceEvidenceRequired
}]

routingSummary = {
  targetCount,
  digestCount,
  initialContextReadCount,
  avoidedInitialContextReads,
  routeCounts,
  persistentCacheAllowed
}
```

## Handoff Rules

- `fast`: simple leaves, primitives, independent images, or confirmed icons with complete facts; usually require no deep read.
- `semantic`: semantic blocks, collections, inputs, component instances, and normal structural containers; read one representative first.
- `deep`: masks, effects, blends, multilayer visuals, unknown fields, or evidence conflicts; read a representative first, then expand conditionally.
- `routingRisk` describes only the risk of acquiring evidence. It must not feed semantic, component, or planning `confidence`.
- Every target digest requires AI confirmation against current semantics. `cached-evidence-revalidation` means a cached digest may be read, not that a historical choice may be reused.
- `instanceDeltas` records only lightweight differences such as name, dimensions, variant, content/variable fingerprint, resource identity, and evidence completeness. Do not copy complete text or node content into a digest.
- `perInstanceEvidenceRequired` explicitly identifies facts that cannot be inherited from the representative. In particular, different `assetIdentity` values require independent resource resolution.
- `complete` cannot be inferred from `get_metadata` alone. It also requires a `completionSource` of `code-connect`, valid-version `versioned-cache`, or `same-request-context`; otherwise read the representative node.
- `figma-node-analysis` must record digests actually expanded and must not label unread instances as deep-read.
