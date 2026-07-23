# Shared ArkUI Quality Gates

These gates apply to component selection, planning, implementation, assembly, and review. Stage files add only stage-specific constraints.

| ID | Gate |
| --- | --- |
| QG-COMPONENT | Use API-backed ArkUI or project components for paging, tabs, collections, refresh, search, input, progress, selection, and value controls. Do not simulate them with Row, Text, static styling, or custom gestures when a verified native component satisfies the evidence. |
| QG-INTERACTION | Paging, scrolling, tabs, refresh, search, selection, input, checking, and value changes demonstrated by Figma must have minimum local interaction. Preserve only event boundaries for external side effects. |
| QG-COLLECTION | Render homogeneous content from an explicit model with stable semantic keys and ForEach/LazyForEach. Choose collection components by semantics, not item count. |
| QG-ICON | Prefer project components, Code Connect, or semantically and visually exact IconFont matches. Otherwise export the original node as a 3x PNG. Forbid text glyph and emoji substitutes. |
| QG-IMAGE | Deduplicate images only by verifiable identity. Keep layout slots, visual closure, export boundaries, PNG files, and display dimensions separate and traceable. |
| QG-TEXT | Merge design-static copy into the page-owning module's `src/main/resources/base/element/string.json` and reference it with `$r('app.string.<name>')`. Do not resource runtime-dynamic content. Implement family, weight, size, lineHeight, letterSpacing, color, alignment, and decoration. |
| QG-LAYOUT | Prove fixed gap, SpaceBetween, flex remainder, scroll with fixed gap, grid, or overlay relationships before binding axis, padding, margin, alignment, and flexibility. Do not encode one distance twice. Calculations at 320/375/480 vp must pass. |
| QG-VISUAL-PROPERTY | Resolve every visible `visualPropertySpec` through current-SDK evidence, then bind every exact or conditional decision to the correct Builder and property scope. Preserve values and ordering; reject omitted, merged, reordered, cross-scope, or approximate mappings. Keep unsupported mappings unresolved. |
| QG-OVERLAY | Prefer `.bindSheet` for a proven bottom sheet. Prefer `.bindPopup`, bound to the proven anchor component, for a position-dependent anchored popup. Allow alternatives only for a verified API capability gap. Use `Stack`/position only for real overlays without native presentation semantics, and never construct normal flow from screenshot coordinates. |
| QG-SHADOW | Preserve every visible shadow layer and its back-to-front order. When `.shadow` accepts one options object, implement multiple supported drop shadows with one transparent, geometry-preserving nested wrapper and one `.shadow` call per layer; keep the background innermost. Reject arrays, repeated calls on one target, merged/omitted/reordered layers, wrapper layout changes, and unsupported-property approximation. |

When a gate cannot be proven by Figma, ArkUI documentation, project evidence, or runtime results, keep it `unresolved` and return to the stage that owns the fact or decision. Do not generate an approximate substitute.
