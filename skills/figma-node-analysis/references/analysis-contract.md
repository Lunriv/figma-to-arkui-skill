# Node Analysis Output Contract

All arrays below must exist together. Use `unknown` rather than omitting a field when evidence is unavailable.

```text
evidenceUsage = {
  routingSummary,
  contextReadNodeIds,
  reusedDigestIds,
  expandedDigestIds,
  avoidedContextReadCount
}

nodeCoverage[] = [{
  nodeId,
  digestId,
  readClass: "deep-read | digest-reused | inherited | decorative | excluded",
  reason
}]

screenVariantGroup[] = [{
  rootNodeIds,
  classification: "page | state | component-variant | overlay",
  evidenceNodeIds,
  sharedShellNodeIds,
  differingBlockIds
}]

blockAnalysis[] = [{
  blockId,
  sourceNodeIds,
  nodeDigestIds,
  parentBlockId,
  business: {
    semanticRole,
    purpose,
    userAction,
    confidence: "confirmed | inferred | unknown",
    standalone,
    inputBoundary,
    eventBoundary
  },
  structure: {
    repetition: "none | homogeneous | heterogeneous",
    ordering: "none | ordered | selectable",
    axis: "none | horizontal | vertical | two-dimensional",
    scrollability: "none | fixed | scrollable | unknown",
    selectionMode: "none | single | multiple | unknown",
    overlay: "none | confirmed | unknown",
    overlayPresentation: "none | bottom-sheet | anchored-popup | dialog | unknown",
    anchorSourceNodeIds
  },
  interactionSpecIds,
  layoutSpecIds,
  textContentSpecIds,
  textStyleSpecIds,
  visualPropertySpecIds,
  shadowSpecIds,
  visualResourceSpecIds,
  unknowns
}]

interactionSpec[] = [{
  interactionId,
  blockId,
  sourceNodeIds,
  kind: "scroll | page-switch | tab-switch | refresh | search | select | input | toggle | value-change | increment | decrement | submit | dismiss | navigate | unknown",
  trigger,
  localUiEffect,
  externalEffect,
  confidence
}]

layoutSpec[] = [{
  layoutId,
  sourceNodeIds,
  parentLayoutId,
  axis: "horizontal | vertical | two-dimensional | overlay",
  relation: "packed-fixed-gap | space-between | flex-remainder | scroll-fixed-gap | grid-fixed-gap | overlay",
  container: {
    mainSizeMode: "fixed | fill | content | viewport",
    designMainSize,
    padding: { before, after, crossBefore, crossAfter }
  },
  crossAlignment: "start | center | end | stretch",
  gap,
  children: [{
    childId,
    sourceNodeIds,
    role: "fixed | intrinsic | flex | scroll-item | overlay",
    basis,
    minSize,
    maxSize,
    grow,
    marginBefore,
    marginAfter,
    allowShrink
  }],
  evidence: [{
    evidenceId,
    kind: "figma-auto-layout | design-context | multi-size-geometry | single-state-bounds | ai-confirmed",
    sourceNodeIds,
    property,
    value,
    samples,
    decisionAuthorityId
  }],
  rejectedRelations: [{ relation, reason, evidenceIds }],
  responsiveTests: [320, 375, 480],
  clipping,
  scrolling,
  overlayEvidence
}]

textStyleSpec[] = [{
  textStyleId,
  sourceNodeIds,
  family,
  weight,
  size,
  lineHeight,
  letterSpacing,
  color,
  alignment,
  decoration
}]

textContentSpec[] = [{
  textContentId,
  blockId,
  sourceNodeIds,
  value,
  usage: "display | option-label | placeholder | accessibility-label | unknown",
  origin: "design-static | runtime-dynamic | user-input | unknown",
  variableBinding,
  confidence
}]

visualPropertySpec[] = [{
  visualPropertySpecId,
  blockId,
  sourceNodeIds,
  targetNodeIds,
  category: "opacity | clipping | corner-radius | fill | gradient | stroke | blur | transform | image-fit",
  figmaProperty,
  scope: "node | paint | effect | image",
  value,
  visible,
  sourceOrder,
  unknownFields,
  confidence
}]

shadowSpec[] = [{
  shadowSpecId,
  blockId,
  sourceNodeIds,
  targetNodeIds,
  targetLayoutSpecIds,
  borderRadius,
  layers: [{
    shadowLayerId,
    sourceEffectIndex,
    visualStackIndex,
    type: "drop-shadow | inner-shadow | unknown",
    visible,
    radius,
    color,
    offsetX,
    offsetY,
    spread,
    blendMode
  }],
  confidence
}]

visualResourceSpec[] = [{
  visualResourceId,
  sourceNodeIds,
  layoutSlotNodeIds,
  visualSeedNodeIds,
  requiredVisualNodeIds,
  boundarySearchRootNodeId,
  semanticName,
  figmaNodeType,
  classification: "Primitive | Icon | Image | unknown",
  componentDescription,
  displaySize,
  assetIdentity,
  uniquenessEvidence,
  confidence
}]

decisionPacket[] = [{
  decisionPacketId,
  blockId,
  impact: "high | medium | low",
  decisionDomains: ["business-semantic | layout-strategy | interaction | component-boundary | visual-style | visual-closure | arkui-api | resource-identity"],
  factRefs: {
    nodeDigestIds,
    interactionSpecIds,
    layoutSpecIds,
    textContentSpecIds,
    textStyleSpecIds,
    visualPropertySpecIds,
    shadowSpecIds,
    visualResourceSpecIds
  },
  instanceDeltaFields,
  openQuestions,
  requestedApiTopics,
  aiDecisionRequired: true
}]
```

`evidenceUsage.avoidedContextReadCount` must come from the routing script and actual expansion log, never estimation. `digest-reused` means only that structural evidence was reused; it does not mean instance differences were confirmed automatically.

`layoutSlotNodeIds` records only arrangement, hit-target, or semantic-layout nodes and cannot double as image export nodes. `visualSeedNodeIds` and `requiredVisualNodeIds` must cover the bitmap, vector, glow, gradient, stroke, and mask nodes that jointly form the image. `boundarySearchRootNodeId` must stop at the current semantic block and must not default to the page root.

`assetIdentity` may come only from component instances, image fills, resource references, or another verifiable identity. Equal dimensions do not prove resource identity. `externalEffect` records a boundary only; it does not implement networking, payment, routing, or persistence.

`visualPropertySpec[]` preserves Figma facts without selecting ArkUI APIs. Record node opacity separately from paint opacity, layer blur separately from background blur, clipping separately from corner radius, and every visible fill or stroke in source order. Preserve unsupported or missing values in `unknownFields`; do not merge multiple paints, infer stroke alignment, convert gradient geometry, or approximate crop transforms during analysis. Keep shadows exclusively in `shadowSpec[]`.

`shadowSpec.layers` contains every visible Figma shadow in explicit back-to-front visual order, with `visualStackIndex: 0` as the backmost layer. Preserve source indices and all available parameters; do not sort layers by radius, offset, opacity, or color. Keep unsupported or missing properties explicit instead of approximating them. A `shadowSpec` with more than one visible layer requires a high-impact `visual-style` and `arkui-api` decision packet.

Mark display text, option labels, placeholders, and accessibility labels explicitly provided by Figma as `design-static` and preserve their original values. Mark runtime API values and state as `runtime-dynamic`, and user input as `user-input`. Never label design-static copy as dynamic to evade string-resource mapping.

`decisionPacket` references facts only; it does not copy complete nodes or ArkUI documentation. Page structure, TabSwitcher, Pager, Carousel, StepFlow, RefreshableCollection, SelectableCollection, DataCollection, SearchInput, InputComposer, BottomSheet, AnchoredPopup, DialogOrSheet, primary ActionArea, and resources containing masks, effects, or multilayer visuals must have `high` impact. Script-generated candidates cannot be written as final answers in decision packets.

## Overlay Presentation Classification

- Set `overlayPresentation: bottom-sheet` when a panel is attached to the viewport bottom and has independent visibility plus at least one of scrim, dismissal, drag-handle, or detent evidence.
- Set `overlayPresentation: anchored-popup` when the floating surface depends on an explicit trigger component. Record the anchor in `anchorSourceNodeIds`; prototype trigger relationships outrank single-frame geometry.
- Set `overlayPresentation: unknown` when only visual proximity exists without anchor evidence. Do not infer `anchored-popup`.
- Keep `overlayPresentation: none` for bottom navigation, fixed toolbars, and normal page content even when they touch the viewport bottom.
- Record presentation facts only in this stage. Do not select `.bindSheet`, `.bindPopup`, or another ArkUI API.

## Layout Relationships

- `relation` first describes how children share the main axis, then records values. Never infer `space-between` merely from similar distances.
- Accept `space-between` only from Figma `SPACE_BETWEEN`, `justify-content: space-between` in design context, or geometric samples from at least two container widths. Single-state bounds may serve only as counterevidence or supplementary facts.
- `flex-remainder` requires an explicit child with `role: flex` and `grow > 0`. Record fixed, intrinsic, and flexible children separately; do not use grow to patch unknown width.
- Children in `scroll-fixed-gap` require fixed `basis`, `allowShrink: false`, and fixed gap. Handle narrow widths through scrolling or clipping, never child compression or gap changes.
- Assign one distance to exactly one of gap, container padding, or a child's margin. Record every candidate alternative in `rejectedRelations` with evidence for rejection.
- `responsiveTests` defaults to and includes at least `320/375/480vp`. Only explicit flexible regions absorb remaining width; local design constants do not scale with screen width.
