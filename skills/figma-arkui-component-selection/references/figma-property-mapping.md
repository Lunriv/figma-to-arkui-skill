# Figma Property to ArkUI Mapping

Use this reference only after node analysis has produced `visualPropertySpec[]`, `shadowSpec[]`, `layoutSpec[]`, and `textStyleSpec[]`. Verify every selected API against the target project's current SDK. The API 24 mappings below are a validation baseline, not a permanent compatibility guarantee.

## Contents

- [Decision Rules](#decision-rules)
- [Blur and Effects](#blur-and-effects)
- [Opacity and Compositing](#opacity-and-compositing)
- [Clipping and Corners](#clipping-and-corners)
- [Fills and Gradients](#fills-and-gradients)
- [Strokes and Outlines](#strokes-and-outlines)
- [Transforms](#transforms)
- [Images](#images)
- [Auto Layout](#auto-layout)
- [Text Styles](#text-styles)

## Decision Rules

1. Match the affected pixels and property scope before matching API names.
2. Preserve every visible source property and its source order. Never flatten multiple paints or effects silently.
3. Use `exact` only when the ArkUI API preserves the proven value, scope, geometry, and interaction behavior.
4. Use `conditional` when the mapping is exact only under recorded constraints. Put every constraint in `conditions`.
5. Use `unresolved` when the current SDK lacks a required field or the Figma evidence is incomplete. Do not approximate unsupported values.
6. Keep Shadow mapping in `shadowDecision[]`; reference that decision instead of duplicating it in `propertyDecision[]`.

## Blur and Effects

| Figma evidence | Preferred ArkUI API | Status requirements | Forbidden mapping |
| --- | --- | --- | --- |
| Layer blur on the current node content | `.blur(radius)` | `exact` when radius and content scope are known | `.backdropBlur()` or a material preset |
| Background blur with only a numeric radius and optional grayscale options | `.backdropBlur(radius, options?)` | `exact` when the background sampling scope and radius are supported | `.blur()` |
| Background blur plus explicit brightness, saturation, color, or adaptive-color behavior | `.backgroundEffect({ radius, brightness, saturation, color, ... })` | `conditional` until every required compound field is supported | Dropping compound fields and retaining only radius |
| System material semantics rather than an exact design radius | `.backgroundBlurStyle(BlurStyle.*, options?)` | `conditional`; record why a preset is semantically required | Treating a preset as an exact numeric radius |

All live blur APIs have rendering cost. Record a performance trade-off for repeated, animated, scrolling, or full-screen blur. Do not replace a proven live effect with a static asset without an explicit resource decision.

## Opacity and Compositing

| Figma evidence | Preferred ArkUI API | Rule |
| --- | --- | --- |
| Node opacity | `.opacity(value)` | Applies to the component subtree and composes multiplicatively with descendant opacity |
| Solid-paint opacity | Alpha in the paint color | Do not reduce child, text, border, or effect opacity |
| Gradient-stop opacity | Alpha in each gradient stop color | Preserve each stop independently |
| Image-paint opacity | Image or paint-layer alpha strategy proven by the current SDK | Do not use parent `.opacity()` when siblings must remain opaque |
| Blend mode | `.blendMode(mode, applyType?)` only after enum and application-scope verification | Record offscreen rendering and blur compatibility constraints |

Store blend mode in the owning paint or effect value. If a required node-level blend mode has no representable owner under the fixed property categories, mark the related property decision `unresolved`.

## Clipping and Corners

| Figma evidence | Preferred ArkUI API | Rule |
| --- | --- | --- |
| Clip content to the component boundary | `.clip(true)` | Record that overflow hit testing is also clipped |
| Circle, ellipse, rectangle, or path clipping | `.clipShape(shape)` | Preserve the proven shape and position; shape fill does not affect clipping |
| Progress or supported shape mask | `.mask(mask)` | Use only when the mask semantics match |
| Uniform corner radius | `.borderRadius(radius)` | Corner radius alone does not prove child clipping |
| Independent corner radii | `.borderRadius({ topLeft, topRight, bottomLeft, bottomRight })` or localized equivalent | Preserve each corner without averaging |

When Figma has both corner radius and clip content, bind both `.borderRadius()` and `.clip(true)`. Do not infer clipping from rounded appearance alone.

## Fills and Gradients

| Figma evidence | Preferred ArkUI API | Boundary |
| --- | --- | --- |
| One solid container fill | `.backgroundColor(color)` | Paint opacity belongs in the color alpha |
| Shape fill | Shape `.fill(color)` | Use only for an actual drawing primitive |
| Linear gradient | `.linearGradient({ angle, colors, repeating })` | Convert Figma geometry to ArkUI's angle convention explicitly |
| Radial gradient with supported circular geometry | `.radialGradient({ center, radius, colors, repeating })` | Non-circular or independently scaled axes are not automatically exact |
| Angular gradient | `.sweepGradient({ center, start, end, rotation, colors, repeating })` | Preserve angular bounds and stop order |
| Diamond gradient | No default exact mapping | `unresolved` unless a current-SDK drawing strategy is verified |
| Multiple visible fills | Explicit ordered paint-layer strategy | `conditional`; otherwise `unresolved` |

Preserve color stops and positions in ascending source order. Do not replace multiple fills, non-circular radial geometry, or a diamond gradient with a single approximate gradient.

## Strokes and Outlines

| Figma alignment | Preferred ArkUI API | Status requirements |
| --- | --- | --- |
| Inside | `.border({ width, color, radius, style })` | Verify per-edge values and radius |
| Outside | `.outline({ width, color, radius, style })` | Exact when the outside geometry is supported; outline does not occupy layout size |
| Center | Verified composite strategy only | `conditional` with exact geometry evidence; otherwise `unresolved` |

Preserve independent edge widths, colors, styles, and radii. Do not map unknown or center alignment to `.border()` by default. Multiple strokes require an ordered composite strategy or remain unresolved.

## Transforms

| Figma evidence | Preferred ArkUI API | Rule |
| --- | --- | --- |
| Rotation | `.rotate()` | Preserve center and axis when present |
| Translation | `.translate()` | Keep layout position separate from visual translation |
| Scale | `.scale()` | Preserve independent axes and transform center |
| Representable matrix | `.transform(matrix)` | Verify Matrix4Transit construction against the current SDK |

Do not reconstruct normal flow from absolute transforms. A complex matrix with unverified decomposition or perspective remains unresolved.

## Images

| Figma image behavior | Preferred ArkUI mapping | Boundary |
| --- | --- | --- |
| Fill container while preserving ratio | `.objectFit(ImageFit.Cover)` | Match crop alignment |
| Fit fully while preserving ratio | `.objectFit(ImageFit.Contain)` | Empty space must match the design |
| Stretch independently on both axes | `.objectFit(ImageFit.Fill)` | Use only when distortion is proven |
| No scaling | `.objectFit(ImageFit.None)` | Verify source and display dimensions |
| Tiled image | `.objectRepeat()` plus compatible fit and sizing | Preserve repeat axis and tile scale |
| Simple centered crop | `ImageFit.Cover` | `conditional` on matching crop geometry |
| Explicit crop transform | `ImageFit.MATRIX` plus a verified matrix | Otherwise `unresolved` |

Keep image display dimensions separate from source decode dimensions and export boundaries. Do not infer object fit from the exported bitmap alone.

## Auto Layout

| Figma evidence | Preferred ArkUI strategy | Boundary |
| --- | --- | --- |
| Horizontal fixed normal flow | `Row` | Use recorded gap, padding, and cross alignment |
| Vertical fixed normal flow | `Column` | Use recorded gap, padding, and cross alignment |
| Wrapping flow | `Flex` with wrap | Do not handwrite wrapped Rows |
| Proven Space Between | `justifyContent: FlexAlign.SpaceBetween` | Require explicit Figma or multi-width evidence |
| Fill or grow child | `.layoutWeight()` or `.flexGrow()` selected for the verified parent layout | Do not mix them or patch unknown width |
| Min/max size | `.constraintSize()` | Constraint priority must be considered with width and height |
| Homogeneous scrolling content | `List`, `Grid`, or `WaterFlow` | Collection semantics override the visual Auto Layout container |
| Discrete page switching | `Swiper` | Page semantics override a horizontal Auto Layout container |

Reuse the existing `layoutSpec` relationship rules. This table selects a candidate strategy; it does not authorize values absent from layout evidence.

## Text Styles

Map existing `textStyleSpec[]` fields directly when supported: family to `.fontFamily()`, weight to `.fontWeight()`, size to `.fontSize()`, line height to `.lineHeight()`, letter spacing to `.letterSpacing()`, color to `.fontColor()`, alignment to `.textAlign()`, and decoration to `.decoration()`. Preserve truncation, maximum lines, and marquee behavior as separate semantic decisions. Do not invent missing Figma text properties from ArkUI defaults.
