# Expected Decisions

This file defines expectations for one concrete case, not an abstract specification.

- Mode switching: `Tabs + TabContent`, supporting tap or swipe to switch content.
- Horizontal options: `List + ListItem + ForEach`, with local single-selection state driven by stable option IDs.
- Grid options: `Grid + GridItem + ForEach`, with local single-selection state driven by stable option IDs.
- Content input: after reading ArkUI documentation, select `TextArea` for multiline input and use a real placeholder.
- Bottom sheet: select `.bindSheet`, plan open/dismiss visibility state and the content builder on a stable host, and preserve only evidence-backed height, detent, drag, and scrim behavior.
- Anchored popup: select `.bindPopup`, bind it directly to the component implementing trigger `1:161`, and preserve evidence-backed placement, offset, and visibility synchronization.
- Multiple shadows: preserve all three layers in `shadowSpec[]`, select `nested-shadow-containers`, and plan three transparent geometry-preserving wrappers from backmost/outermost to frontmost/innermost. Apply one `.shadow` per wrapper and keep the background on the content only.
- Write design-static copy to the component-owning module's `src/main/resources/base/element/string.json`. Store `ResourceStr` in option models; Text and placeholder ultimately reference `$r('app.string.<name>')`.
- Do not write dynamic state, API data, or user input to `string.json`.
- For each icon, follow project declarations, imports, and usage to confirm a component, IconFont, or PNG implementation. Never declare an exact mapping with insufficient evidence.
- Keep a separate resource decision for every independent visual resource and export each as a 3x PNG.
- For every visual resource, separate the outer layout slot from internal visual nodes, then use the smallest complete boundary to determine PNG and ArkUI Image dimensions.
- Include every family, weight, size, and lineHeight combination in font decisions.
- Express fixed spacing with space, padding, margin, and alignment, not fixed-size Blank.
