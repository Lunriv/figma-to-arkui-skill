# Blocking Review Checklist

## Decisions and Implementation

- NodeDigest reuse does not override instance differences. Every upstream ID, high-impact AI decision, current-SDK API evidence item, and planning decision resolves correctly.
- Actual code passes QG-COMPONENT, QG-INTERACTION, QG-COLLECTION, QG-ICON, QG-IMAGE, QG-TEXT, QG-LAYOUT, QG-VISUAL-PROPERTY, QG-OVERLAY, and QG-SHADOW individually.
- The cache reuses only facts/APIs and has been revalidated against the current instance, SDK, layout, and minimum interactions.
- Every visible `visualPropertySpec` has exactly one `propertyDecision`. Every exact or conditional decision has exactly one `visualPropertyBinding`; unresolved decisions block acceptance.

## Resources and Boundaries

- Every `design-static` text has a `stringResourceDecision`; its entry exists in the component-owning module's `src/main/resources/base/element/string.json`, ETS uses `$r('app.string.<name>')`, and no static copy is inline.
- String resource names use stable English semantics, not Chinese, pinyin, content hashes, or meaningless sequence numbers. Merging does not overwrite unrelated existing entries.
- Every icon has a project-component, Code Connect, exact IconFont, or `Png3xFallback` decision. Code contains no text-glyph substitute.
- Every PNG comes from REST `/v1/images`, with no remote URL, Base64, temporary resource, screenshot, or incorrect reuse.
- Each boundary is `resolved` with accepted purity and AI-confirmed visual closure. The export node is not a layout slot, and all four numeric values lie on the half-pixel grid.
- Image dimensions equal `imageDisplaySize`. Downloads use `contents_only=true` and `use_absolute_bounds=true` and pass 3x pixel validation.

## Visual and Layout Constraints

- Compare every actual visual property with `visualPropertyBinding` on the specified Builder and target component. Values, property scope, order constraints, and conditional requirements must match.
- Node opacity uses node `.opacity()` and paint opacity remains in the owning color or paint. Reject parent opacity used to approximate one translucent fill or gradient stop.
- Layer blur uses `.blur()` and simple numeric background blur uses `.backdropBlur()`. Compound background effects and system materials use only their selected documented APIs.
- Inside and outside strokes use the selected border or outline strategy. Center or unknown stroke alignment cannot silently become `.border()`; multiple strokes cannot be merged.
- Corner radius does not substitute for proven clipping. Multiple fills, unsupported gradients, crop transforms, blend modes, and effect fields remain ordered and exact or unresolved.
- Code contains no visual-property pattern listed in `visualPropertyBinding.forbiddenPatterns`, and shadows remain exclusively in `shadowBinding`.

- Every visible Figma shadow has one `shadowSpec` layer, one `shadowBinding.layerBinding`, and one actual `.shadow` call with matching supported parameters. Layer count and back-to-front order are unchanged.
- Multi-shadow code uses transparent, layout-neutral nested wrappers from outermost/backmost to innermost/frontmost. Every wrapper preserves the target size and border radius; only the innermost content owns the background.
- Code contains no shadow array, repeated `.shadow` calls on one target, merged/omitted/value-sorted layers, shadow-only PNG fallback, or wrapper-introduced padding, margin, spacing, clipping, layout weight, or hit target. Unsupported properties remain unresolved.
- Actual `bottom-sheet` code uses the planned `.bindSheet` with open, dismiss, and visibility synchronization. Any alternative has current-SDK evidence for the unmet requirement.
- Actual `anchored-popup` code invokes `.bindPopup` on the planned anchor component. Anchor nodes, placement, offset, and visibility state are traceable; the binding is not moved to the page root or simulated with a full-page `Stack`.
- An `unknown` overlay is not silently implemented as `.bindSheet` or `.bindPopup`. Bottom navigation, toolbars, and normal bottom content are not misclassified as sheets.
- `SpaceBetween` has Figma `SPACE_BETWEEN`, design-context `justify-between`, or geometric evidence from at least two width states. Reject equal spacing from a single state.
- Bind every `layoutWeight` to an explicit flex child in `flex-remainder`. Do not apply it to fixed items, scrolling items, or unknown widths.
- Encode one distance with exactly one of `space`, padding, or margin. Homogeneous scrolling items have fixed dimensions and fixed gap and do not shrink.
- Every ArkUI padding, margin, space, alignment, scrolling, and flexibility property traces to a `layoutSpec`, with no property listed in `layoutBinding.forbiddenProperties`.
- Deterministic layout validation at `320/375/480vp` shows no negative remainder, unintended stretching, or fixed-item compression. Horizontal collections scroll on narrow screens.
- Compare actual ETS with `layoutBinding` builder by builder, then accept against local screenshots. Scripts must not infer complete code semantics with regex or an incomplete AST.

## Validation

- Static audit has no errors. ArkUI API/syntax checks and project-supported compilation validation pass, or existing blockers are recorded accurately.
- Static scripts validate IDs, required fields, and deterministic constraints only. They must not infer complete ArkUI visual-property semantics from regex or an incomplete AST; perform the Builder-by-Builder comparison above.
- Runtime results are compared with Figma screenshots by local region for containers, padding, gap, font baselines, asset cropping, and interaction states. Layout error is at most 1 vp, text-baseline error is at most 2 vp, and screenshots were not used to derive layout.
- Every implementation and resource satisfies the shared traceability contract. Unresolved fonts or resources are reported explicitly.
