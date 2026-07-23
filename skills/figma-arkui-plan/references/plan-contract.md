# ArkUI Component Planning Contract

```text
componentPlan[] = [{
  componentId,
  componentName,
  targetFile,
  parentComponentId,
  semanticRole,
  businessResponsibility,
  planningDecisionId,
  decisionPacketIds,
  nodeDigestIds,
  arkuiEvidenceId,
  selectedComponents,
  childComponentIds,
  dataModel,
  businessKey,
  inputBoundary,
  eventBoundary,
  interactionState,
  minimumInteraction,
  presentationApi: "bindSheet | bindPopup | none",
  bindingHostComponentId,
  bindingHostSourceNodeIds,
  shadowSpecIds,
  shadowDecisionIds,
  visualPropertySpecIds,
  propertyDecisionIds,
  visualPropertyBindingIds,
  layoutSpecIds,
  textContentSpecIds,
  textStyleSpecIds,
  stringResourceDecisionIds,
  resourceDecisionIds,
  exportBoundaryDecisionIds,
  auditRequirementIds,
  confidence,
  implementationOrder,
  unresolved
}]

planningDecision[] = [{
  planningDecisionId,
  componentId,
  decisionPacketIds,
  aiDecisionStatus: "confirmed | unresolved",
  componentBoundaryRationale,
  layoutStrategy,
  stateOwnershipRationale,
  apiEvidenceIds,
  rejectedPlanAlternatives
}]

layoutBinding[] = [{
  layoutBindingId,
  layoutId,
  componentId,
  targetBuilder,
  arkuiStrategy: "packed-fixed-gap | space-between | flex-remainder | scroll-fixed-gap | grid-fixed-gap | overlay",
  propertyBindings: [{
    target,
    property,
    value,
    factPath
  }],
  forbiddenProperties,
  testWidths: [320, 375, 480]
}]

visualPropertyBinding[] = [{
  visualPropertyBindingId,
  propertyDecisionId,
  visualPropertySpecIds,
  componentId,
  targetBuilder,
  targetComponent,
  mappingStatus: "exact | conditional",
  propertyBindings: [{
    target,
    property,
    value,
    factPath
  }],
  orderConstraints,
  forbiddenPatterns
}]

shadowBinding[] = [{
  shadowBindingId,
  shadowSpecId,
  shadowDecisionId,
  componentId,
  targetBuilder,
  contentTarget,
  strategy: "single-shadow | nested-shadow-containers",
  layerBindings: [{
    shadowLayerId,
    wrapperDepth,
    targetContainer,
    propertyBindings: [{ property, value, factPath }]
  }],
  sharedGeometryBindings: [{ property, value, factPath }],
  backgroundTarget,
  forbiddenPatterns
}]

stringResourceDecision[] = [{
  stringResourceDecisionId,
  textContentSpecIds,
  componentId,
  targetModule,
  resourceFile,
  resourceName,
  value,
  usage: "display | option-label | placeholder | accessibility-label",
  resolution: "create | reuse-existing",
  sourceFiles
}]

traceability[] = [{
  nodeIds,
  nodeDigestIds,
  decisionPacketIds,
  blockId,
  interactionSpecIds,
  arkuiEvidenceId,
  planningDecisionId,
  componentId,
  targetFile,
  layoutSpecIds,
  visualPropertySpecIds,
  propertyDecisionIds,
  visualPropertyBindingIds,
  shadowSpecIds,
  shadowDecisionIds,
  shadowBindingIds,
  textContentSpecIds,
  textStyleSpecIds,
  stringResourceDecisionIds,
  resourceDecisionIds,
  exportBoundaryDecisionIds,
  presentationApi,
  bindingHostSourceNodeIds
}]
```

## State Ownership

- Plan tab indices, currently selected semantic IDs, input content, checked state, and similar values as local presentation state when they drive only the current component.
- When state is shared by multiple components or controlled by the caller, plan explicit inputs and change callbacks.
- Do not create networking, payment, routing, or persistence behavior in a static implementation. Preserve only event boundaries.

State ownership and component boundaries are AI planning decisions. Scripts may validate complete references, acyclic ordering, and the presence of state fields, but cannot confirm `planningDecision` from a fixed template.

## Overlay Binding Planning

- For `presentationApi: bindSheet`, plan boolean visibility state and the content builder in the stable host responsible for opening and dismissing the sheet. Do not rebuild the bottom panel with a page-level `Stack`.
- For `presentationApi: bindPopup`, `bindingHostComponentId` must identify the anchor component that implements `bindingHostSourceNodeIds`, and `.bindPopup` must bind directly to that component. Do not move it to the page root or an unrelated container.
- Plan open, dismiss, scrim-tap, and state callbacks only when supported by design and API evidence. Mark the plan `unresolved` and return upstream when the anchor component, visibility owner, or dismissal path is unknown.

## Shadow Binding

- Create one `layerBinding` per visible layer. For `nested-shadow-containers`, set `wrapperDepth: 0` on the outermost wrapper for `visualStackIndex: 0`, then increase depth toward the frontmost layer. Do not reorder layers by their values.
- Bind every wrapper's size and border radius through `sharedGeometryBindings`. Wrappers must remain transparent and layout-neutral; they must not add padding, margin, spacing, clipping, layout weight, or hit targets.
- Set `backgroundTarget` to `contentTarget`, which remains inside all shadow wrappers. Apply exactly one `.shadow` call to each target container and copy radius, color, offsets, and every supported property from its layer fact.
- Put shadow arrays, repeated `.shadow` calls on one target, layer merging or omission, value-based reordering, and wrapper layout deltas in `forbiddenPatterns`. Mark unsupported layer properties `unresolved` instead of approximating them.

## Visual Property Binding

- Create exactly one `visualPropertyBinding` for every `propertyDecision` with `mappingStatus: exact` or `conditional`. A binding may contain multiple ArkUI properties only when the decision requires them together, such as corner radius plus clipping.
- Bind every property value to a `visualPropertySpec` fact path. Preserve target scope: node opacity cannot consume paint-opacity facts, and paint alpha cannot consume node-opacity facts.
- Put property-chain dependencies and paint or effect ordering in `orderConstraints`. Do not reorder visible fills, gradients, strokes, clipping, or effects for implementation convenience.
- Put forbidden substitutes from the property decision in `forbiddenPatterns`, including `.blur()` for background blur, parent `.opacity()` for paint alpha, `.border()` for unknown or center stroke alignment, and approximate gradients or crop transforms.
- Do not create a binding for `mappingStatus: unresolved`. Add the decision to the component's `unresolved` list and return it to component selection or node analysis before implementation.
- Keep shadow properties in `shadowBinding[]`. Do not duplicate `.shadow()` calls or layer facts in `visualPropertyBinding[]`.

## Layout Binding

- Each `layoutSpec` must map to the target builder through exactly one explicit `layoutBinding`. `arkuiStrategy` must match `relation`.
- Record every actual ArkUI layout property in `propertyBindings`. `factPath` points exactly to a `layoutSpec` field such as `gap`, `container.padding.before`, or `children[track].grow`.
- Numeric values must match facts exactly. Enum names may use ArkUI spelling such as `SpaceBetween`; validation normalizes only case, hyphens, underscores, and spaces. Numeric conversion or approximation is forbidden.
- Bind `layoutWeight` only to `grow` on a child with `role: flex` in `flex-remainder`. Never use it to patch an unknown width.
- `forbiddenProperties` records substitute properties prohibited in the same builder, such as unsupported `justifyContent:SpaceBetween`, margins on homogeneous items, or `layoutWeight` on fixed items.
- Block implementation when fixed gap, padding, margin, alignment, scrolling, or flexibility properties lack fact references. Planning must not invent layout values.

## Collections

A homogeneous collection requires a data model with explicit fields and a stable semantic key. `selectedComponents` must come from `arkuiEvidence[]`. Planning decides only component boundaries and state ownership; it must not reselect Row/List/Grid based on count or visual impression.

## String Resources

- Every `design-static` text requires a `stringResourceDecision`. Do not write `runtime-dynamic` or `user-input` text to `string.json`.
- Determine the page-owning module from `targetFile`. Set `resourceFile` to that module's `src/main/resources/base/element/string.json`; never default to `entry` or another module.
- Use stable English semantics and lowercase snake case matching `^[a-z][a-z0-9_]*$` for `resourceName`. Forbid Chinese, pinyin, content hashes, and meaningless sequence numbers.
- Merge the existing `string.json` and preserve unrelated entries. Use `reuse-existing` only when name, value, and semantics all match. Use a new semantic name when the same name has a different value or the same value has different meaning. Never overwrite or merge incorrectly.
- Preserve the original Figma value and line breaks in `value`. Display text, option models, and placeholders must ultimately reference `$r('app.string.<resourceName>')`.

## Unresolved Items

Image dimensions must come from `exportBoundaryDecision.imageDisplaySize`, never a layout slot, visual leaf, or earlier `displaySize`. Add `unresolved` when visual-property mappings, module ownership or string-resource names are unresolved, fonts are unavailable, resource identity is unknown, boundaries are unresolved or awaiting manual review, API versions are incompatible, or evidence is insufficient. Stop implementation when an unresolved item affects the correct component or production resource. Do not generate an approximate substitute.
