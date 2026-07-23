# Component Selection Output Contract

```text
arkuiDocumentEvidence[] = [{
  documentEvidenceId,
  componentName,
  sdkVersion,
  source,
  location,
  apiLevel,
  signatures,
  properties,
  events,
  cacheKey
}]

arkuiEvidence[] = [{
  arkuiEvidenceId,
  decisionPacketId,
  blockId,
  semanticRole,
  selectedComponents,
  documentEvidenceIds,
  aiDecisionStatus: "confirmed | unresolved",
  decisionProvenance: "fresh-api-review | cached-api-evidence-revalidated",
  contextDeltaChecked,
  apiApplicability,
  apiTradeoff,
  minimumInteraction,
  stateRequirement,
  presentationApi: "bindSheet | bindPopup | none | unresolved",
  bindingHostSourceNodeIds,
  rejectedAlternatives: [{ alternative, reason }],
  confidence
}]

propertyDecision[] = [{
  propertyDecisionId,
  decisionPacketId,
  blockId,
  visualPropertySpecIds,
  targetNodeIds,
  category: "opacity | clipping | corner-radius | fill | gradient | stroke | blur | transform | image-fit",
  mappingStatus: "exact | conditional | unresolved",
  arkuiApi,
  arkuiPropertyBindings: [{
    targetScope,
    property,
    valueSource
  }],
  documentEvidenceIds,
  conditions,
  unsupportedFields,
  rejectedAlternatives: [{ alternative, reason }],
  confidence
}]

shadowDecision[] = [{
  shadowDecisionId,
  shadowSpecId,
  implementation: "single-shadow | nested-shadow-containers | unresolved",
  documentEvidenceIds,
  visibleLayerCount,
  layerOrderPreserved,
  requiredSharedGeometry: ["size", "borderRadius"],
  backgroundOwner: "innermost-content",
  rejectedAlternatives: [{ alternative, reason }],
  confidence
}]

resourceDecision[] = [{
  resourceDecisionId,
  visualResourceSpecId,
  implementation: "ExistingComponent | IconFont | Primitive | Png3x | Png3xFallback | unresolved",
  projectEvidence,
  iconFontMember,
  fontFamilyEvidence,
  requiresExportBoundary,
  boundaryInputIds,
  assetIdentity,
  deduplicationEvidence,
  unresolvedReason
}]

fontDecision[] = [{
  fontDecisionId,
  textStyleSpecIds,
  figmaFamily,
  figmaWeight,
  projectFamily,
  projectWeight,
  availabilityEvidence,
  status: "exact | mapped | unresolved"
}]

auditRequirements[] = [{
  auditRequirementId,
  blockId,
  requiredComponents,
  requiredInteractions,
  requiredPresentationApi: "bindSheet | bindPopup | none",
  requiredBindingHostSourceNodeIds,
  requireForEach,
  forbidTextGlyphFallback,
  forbidFixedBlank,
  requiredTextStyleSpecIds,
  requiredPropertyDecisionIds,
  requiredResourceDecisionIds
}]
```

`Png3x` and `Png3xFallback` must set `requiresExportBoundary: true` and reference corresponding boundary inputs. This stage must not fill the final export node directly. `documentEvidenceIds` must point to ArkUI documentation actually read in the current pass or found in a same-SDK cache; memory is not accepted as evidence. `cacheKey` includes at least the SDK version and component name. When the version is unknown, reuse is limited to the current task. `minimumInteraction` covers only local interface behavior such as scrolling, tabs, selection, input, and checks. External side effects remain event boundaries.

When `decisionProvenance` indicates cached evidence revalidation, `contextDeltaChecked` must be true and record current instance, SDK, interaction, and layout differences. Cache API facts, not component choices. Do not enter planning until `aiDecisionStatus` is confirmed.

## Visual Property API Mapping

- Resolve every visible `visualPropertySpec` exactly once through `propertyDecision[]`. A decision may reference multiple specs only when they share one target, category, source value, scope, and ArkUI mapping.
- Read [Figma Property Mapping](figma-property-mapping.md) and current-SDK documentation before selecting an API. The reference narrows candidates but never replaces current documentation evidence.
- Set `mappingStatus: exact` only when property scope, geometry, values, ordering, and side effects are preserved. Put all required preconditions for `conditional` in `conditions`.
- Populate `unsupportedFields` and set `unresolved` when the SDK or evidence cannot preserve a required value. Keep `arkuiApi` and `arkuiPropertyBindings` empty for unresolved mappings; do not emit an approximate API.
- Keep shadows in `shadowDecision[]`. A visual property decision may reference a shadow decision as a dependency but must not duplicate its layers.

## Shadow API Mapping

- Use `single-shadow` for one supported visible layer and `nested-shadow-containers` for multiple supported visible shadow layers when the current `.shadow` API accepts only one options object.
- For `nested-shadow-containers`, require exactly one transparent wrapper and one `.shadow` call per layer. Map `visualStackIndex: 0` to the outermost wrapper, then continue inward so the frontmost shadow is innermost. Preserve source order; never sort by radius, offset, opacity, or color. `single-shadow` uses one `.shadow` call on the original target without a wrapper.
- Require all wrappers to preserve the target size and border radius without adding padding, margin, spacing, background, clipping, or layout weight. Keep the original background on `innermost-content` only.
- Reject a shadow array, repeated `.shadow` calls on one component, merged or omitted layers, and PNG fallback used only to avoid nesting.
- Map a supported Figma inner shadow through the current SDK's internal-fill option, such as `fill: true`, and an outer shadow through `fill: false` or the documented default. Mark the decision `unresolved` when any required layer uses an unsupported spread, blend mode, shadow type, or other property. Do not approximate unsupported values.

## Overlay API Mapping

- For `overlayPresentation: bottom-sheet`, prefer `presentationApi: bindSheet`. Visibility state must support opening and dismissal; height, detents, drag, and scrim behavior require design and current-SDK evidence.
- For `overlayPresentation: anchored-popup`, prefer `presentationApi: bindPopup`. `bindingHostSourceNodeIds` must match the analysis-stage `anchorSourceNodeIds`; do not guess placement or offset independently from anchor evidence.
- Select an alternative only when the preferred API has a verified SDK incompatibility or cannot satisfy proven content or interaction requirements. Record the exact capability gap in `apiTradeoff` and `rejectedAlternatives`.
- Do not select `bindSheet` or `bindPopup` for `overlayPresentation: unknown`; return to node analysis for evidence.
