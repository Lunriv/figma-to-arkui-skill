# Expected Rejections

The following cases only verify that review blocks known regressions:

- Simulate tabs with Row + Text.
- Simulate an input and placeholder with Row + Text.
- Simulate a proven bottom sheet with a page-level `Stack`, or choose a generic dialog without a documented `.bindSheet` capability gap.
- Bind a proven anchored popup to the page root, simulate it with a full-page `Stack`, or replace it with `.bindSheet`.
- Infer an anchored popup from visual proximity without a verified trigger or anchor relationship.
- Flatten, omit, or sort multiple shadow layers by radius; pass a shadow array; or chain repeated `.shadow` calls on one component.
- Add padding, margin, spacing, clipping, layout weight, background, or a hit target to a shadow-only wrapper.
- Export a component as PNG only to avoid nested shadow containers, or approximate an unsupported shadow property.
- Inline design-static copy in `Text`, option models, or placeholders.
- Write strings to the wrong module, overwrite an existing same-name/different-value entry, or use Chinese, pinyin, or meaningless sequence numbers as resource names.
- Simulate icons with `✓`, `‹`, `•••`, `↑`, `✦`, or emoji.
- Handwrite a homogeneous collection instead of using ForEach/LazyForEach.
- Share one resource across distinct Images without identity evidence.
- Draw spacing or shapes with Blank using fixed width/height/backgroundColor.
- Omit known Figma family, weight, or lineHeight from implementation and traceability.
- Export a content container, button, or hit target while forcing ArkUI Image to the inner image dimensions.
- Derive the PNG export boundary and ArkUI Image dimensions from different nodes.
- Silently round a boundary containing a coordinate or dimension that is neither an integer nor `.5`.
- Send a contaminated boundary to asset download without manual approval.
