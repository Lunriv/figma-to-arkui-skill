# Generic Semantic Page Fixture Evidence

This directory is for regression tests only. It does not define general rules.

## Input Nodes

- Page states: `1:100`, `1:101`
- Horizontal options: `1:110`
- Grid options: `1:120`
- Top navigation: `1:130`
- Content input: `1:140`
- Bottom sheet state: `1:150`, attached to the viewport bottom with a scrim, dismiss action, and independent visibility.
- Anchored popup state: `1:160`, opened from trigger `1:161` and positioned relative to that trigger.
- Generic control surface: `1:170`, with three visible drop-shadow effects in explicit back-to-front order on the same rounded bounds.

## Compact Evidence

- `Mode one` and `Mode two` are mutually exclusive states of the same content region.
- Four horizontal options are homogeneous, extend beyond the visible range, and have selected variants.
- Six grid options are homogeneous, arranged in three columns and two rows, and have selected and badge variants.
- The input region contains a placeholder, attachment entry point, and submit entry point.
- Several action icons have clear semantics, but their project implementations still require evidence.
- Several visual resources have different identities and cannot be merged by dimensions alone.
- Text contains multiple explicit family, weight, size, and line-height combinations.
- The bottom sheet is an independent overlay rather than bottom navigation or normal page content.
- The anchored popup has a verified trigger relationship; visual proximity alone is not evidence.
- The three shadow layers have independent radius, color, and offsets. They remain component styling rather than a raster resource.
