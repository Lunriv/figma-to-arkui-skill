# Export-Boundary Contract

## Input

```text
boundaryInput[] = [{
  boundaryDecisionId,
  resourceDecisionId,
  resourceName,
  figmaUrl,
  layoutSlotNodeIds,
  visualSeedNodeIds,
  requiredVisualNodeIds,
  boundarySearchRootNodeId,
  decisionPacketId,
  visualClosureDecisionId,
  visualClosureDecisionStatus: "confirmed | unresolved",
  visualClosureDecisionProvenance: "fresh-ai-review | cached-evidence-revalidated",
  visualClosureRationale,
  manualDecision,
  approvedExportNodeId
}]
```

- `visualSeedNodeIds` are visually contributing nodes such as image fills, vectors, glows, gradients, strokes, or masks.
- `requiredVisualNodeIds` form the complete visual closure that must enter one PNG. They must not include layout-only nodes, hit targets, or unrelated semantic content.
- `requiredVisualNodeIds` must come from an AI `visualClosureDecision`. Scripts may validate only the common container and geometry; they cannot infer missing layers.
- `boundarySearchRootNodeId` is the highest semantic boundary within which common ancestors may be searched. Do not default to the page root.
- Populate `manualDecision` and `approvedExportNodeId` only after the user explicitly accepts the current candidate. Both must match the current calculation result.

## Output

```text
exportBoundaryDecision[] = [{
  boundaryDecisionId,
  resourceDecisionId,
  resourceName,
  figmaNodeUrl,
  layoutSlotNodeIds,
  requiredVisualNodeIds,
  decisionPacketId,
  visualClosureDecisionId,
  visualClosureDecisionStatus,
  visualClosureDecisionProvenance,
  candidateNodeIds,
  selectedExportNodeId,
  selectedBounds: { x, y, width, height },
  imageDisplaySize: { width, height },
  purityStatus: "clean | manual-approved | contaminated | unknown",
  numericStatus: "valid | invalid",
  decisionStatus: "resolved | manual-review | unresolved | skipped",
  manualDecision,
  problem
}]

manualReview[] = [{
  resourceName,
  figmaNodeUrl,
  problem,
  choices: ["export current boundary", "provide the correct image link", "skip this resource"]
}]
```

The internal contract retains node IDs for traceability. Candidates inside instances may use inherited identifiers returned by Figma. User prompts must link to the nearest openable instance node and must not display or construct links from non-openable internal identifiers.

## State Transitions

- Confirmed AI visual closure with `clean + valid`: output `resolved`.
- Missing AI visual-closure decision: output `unresolved` and return to node analysis or resource selection.
- Additional visible content: output `manual-review` and wait for a batch decision.
- Missing nodes, visual closure outside the search root, no common container, or non-half-pixel values: output `unresolved`.
- User accepts the current boundary: record `resolved + manual-approved` and set `manualDecision: "accept-current-boundary"`.
- User provides a new link: rerun complete boundary selection with the new link.
- User skips the resource: record `skipped + manualDecision: "skip-resource"`; do not download it, and disclose the unimplemented resource in final delivery.

If any item is `manual-review` or `unresolved`, the batch cannot enter asset download. Explicitly `skipped` resources do not block other resolved resources, but never enter the download manifest themselves.
