# Visual Resource and Font Resolution

## Decision Order

1. Check whether Code Connect or existing project components provide the same semantics and state.
2. For `Icon`, search IconFont according to the project's actual declarations, wrappers, and references. Accept only exact members with complete evidence.
3. Implement `Primitive` with native ArkUI colors, gradients, corner radii, strokes, or basic shapes.
4. Add `Image` to the production 3x PNG manifest.
5. When IconFont has no exact member, mark the original icon node as `Png3xFallback`.

`Png3x` and `Png3xFallback` determine only that a production image is required, not the final export node. Pass layout slots, visual seeds, required visual nodes, and the search root from node analysis to `figma-export-boundary-selection`.

Project searches provide candidate facts only. Confirm the implementation only after comparing Figma semantics, state, fill/stroke form, color capability, and project-component responsibility.

Every path forbids Unicode glyphs, emoji, approximate characters, and temporary URLs as substitutes for production resources.

## Image Deduplication

Deduplicate images only when `assetIdentity` and visual content are identical. None of these conditions independently proves reuse:

- Equal display dimensions.
- Similar product purpose.
- Equal node names.
- Membership in the same collection.

Images with different identities require separate export nodes and resource names.

Before boundary selection completes, do not substitute `sourceNodeIds`, the outermost frame, or a temporary asset node for the final export boundary.

For multilayer images, `requiredVisualNodeIds` requires an AI visual-closure decision. Scripts must not add or remove required nodes based on minimum geometry.

## IconFont

First narrow the search with `rg` using the Figma semantic name, candidate English aliases, component references, and `fontFamily` usage. Then follow declaration, import, and call relationships to confirm whether the project uses static members, object maps, enums, resource tables, generated code, or wrapper components.

`resourceDecision` must record the exact member, font-family evidence, existing project usage, and color/dimension sources. Mark it `exact` only when member declaration, font-family usage, semantics, and visual form all match. Never accept normalized name similarity automatically. When the evidence chain is incomplete, mark it `unresolved` or use `Png3xFallback`.

## Fonts

For every Figma family/weight pair, inspect project font resources, registration configuration, and existing usage. Record an exact mapping when available. Otherwise mark it `unresolved` and disclose the deviation at delivery; never silently fall back and claim fidelity.
