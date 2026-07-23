# Evidence Capture Rules

## Interaction

- Different selected states or component variants on the same screen prove local UI effects such as `tab-switch`, `select`, and `toggle`.
- A scrollable container, homogeneous items beyond the visible range, or a scrolling prototype proves `scroll`.
- Discrete page indices, page snapping, page indicators, explicit next/previous actions, or autoplay and loop settings prove `page-switch`. A horizontal arrangement alone does not.
- Pull displacement plus refreshing state or a refresh prototype proves `refresh`; a refresh-shaped icon alone does not.
- A query input with search submission or query-change behavior proves `search`; a magnifying-glass decoration alone does not.
- A bounded value with an explicit current value and user adjustment proves `value-change`; separate plus and minus actions prove `increment` and `decrement`.
- A placeholder, cursor, input region, and submit entry point prove `input`; keep post-submit side effects as external event boundaries.
- Record only interface interactions proven by Figma or project context. Do not infer payment, networking, routing, or persistence.

## Layout

For each semantic block, first classify `packed-fixed-gap`, `space-between`, `flex-remainder`, `scroll-fixed-gap`, `grid-fixed-gap`, or `overlay`. Then record the container's main-axis sizing mode, four-sided padding, cross-axis alignment, child roles, fixed dimensions, grow, min/max, independent margins, clipping, and scrolling. Use absolute positions only to confirm real overlays; coordinates must not replace normal flow structure.

Layout evidence priority: Auto Layout properties > node constraints > relative bounding dimensions > screenshot appearance. Screenshots do not provide layout input.

- Prove `SPACE_BETWEEN` only through Figma Auto Layout, `justify-between` in design context, or geometric changes across at least two width states. Apparent equal spacing in one design is insufficient.
- Trace fixed gaps and child margins separately; do not attribute one distance twice. Confirm fixed dimensions and no shrinking for every item in a scrolling collection.
- For each layout relationship, record rejected alternatives and evidence-based reasons, then calculate remaining width, clipping, scrolling, and stretching at `320/375/480vp`.

## Text

Every text style records family, weight, size, lineHeight, letterSpacing, color, alignment, and decoration. Identical styles may share one `textStyleSpec`, but must retain all source nodes.

Generate a `textContentSpec` for every text value, preserving its original value, usage, and origin. Fixed Figma display copy, option labels, placeholders, and accessibility labels are `design-static`. API return values and component input state are `runtime-dynamic`; user input is `user-input`. Do not write either category to string resources.

Write `unknown` for properties not returned by Figma. Never fill them with ArkUI defaults and mark them confirmed.

## Visual Resources

- `Primitive`: solid colors, gradients, corner radii, strokes, dividers, and basic shapes that ArkUI can reproduce reliably.
- `Icon`: vector/component nodes proven to be icons by component descriptions, instance names, or semantics.
- `Image`: image fills, bitmaps, illustrations, textures, photos, or complex composites with independent visual identity.

Record `assetIdentity` for every resource. Deduplicate only when identity and visual content match. Similar node dimensions, purpose, or naming cannot independently prove reuse.

For every `Image` and each `Icon` that may fall back to PNG, distinguish all of the following:

- `layoutSlotNodeIds`: list items, buttons, hit targets, or arrangement containers.
- `visualSeedNodeIds`: nodes that directly contribute image pixels.
- `requiredVisualNodeIds`: image, glow, gradient, stroke, and mask nodes that must enter the same resource.
- `boundarySearchRootNodeId`: the highest semantic node within which the smallest common container may be found.

Do not write outer-container dimensions into image `displaySize`. If current MCP context cannot prove visual seeds or the search root, continue deep-reading the resource subtree. Never treat the first visible frame as the resource node.

## Visual Properties

- Create one `visualPropertySpec` for each relevant target and property scope. Preserve node opacity, paint opacity, clipping, corner radius, each fill or gradient, each stroke, each non-shadow blur, transforms, and image-fit or crop facts independently.
- Preserve all visible fills and strokes in source order. Do not collapse multiple paints into one color or gradient.
- Record effect type exactly as layer blur or background blur. Do not choose `.blur`, `.backdropBlur`, or another ArkUI API in this stage.
- Record stroke alignment only when Figma evidence exposes it. Keep missing alignment `unknown`; visual appearance is insufficient.
- Record gradient type, stops, stop positions, geometry, angle or handles, and repetition when available. Do not convert between Figma and ArkUI coordinate systems here.
- Record image scale mode, crop transform, alignment, repeat, and visible bounds independently. A layout slot is not an image crop specification.
- Keep component shadows in `shadowSpec[]`; do not duplicate them as blur or stroke properties.

## Digest Reuse

- Deep-read only a representative for each structural fingerprint. Reuse component structure, Auto Layout mode, stable style tokens, and component descriptions.
- Still record text content, variable overrides, variants, dimensions, selection state, and image identity for every instance. Routing handoffs may use content/variable fingerprints, while the semantic analysis report retains actual evidence.
- When a representative contains masks, effects, unknown fields, or instance differences, expand incrementally according to the routing report. Never record conflicts as inherited facts.
- For every component shadow, capture the target node, border radius, source effect index, back-to-front visual stack index, type, visibility, radius, color, offsets, spread, and blend mode in `shadowSpec[]`. Keep multiple shadows as ordered layers on one target; do not flatten them into one value or classify the component as an image merely because ArkUI needs wrappers.
- Put only NodeDigests and actual evidence conclusions in handoff reports. Do not copy reference code from `get_design_context`.

## AI Decision Packets

- Organize decision packets by semantic action, not layer count. One packet should let AI judge semantics, component boundaries, interactions, and APIs to query together.
- Retain fact references and conflicts in the packet. Do not prefill component answers such as Tabs, List, Grid, or Input.
- When the digest is insufficient, expand original MCP evidence by `nodeDigestId`. Never accept incomplete facts merely because the packet already exists.
- A multilayer-image packet must reference visual seeds, candidate required nodes, and the search root. AI decides visual closure before handoff to the geometry script.
