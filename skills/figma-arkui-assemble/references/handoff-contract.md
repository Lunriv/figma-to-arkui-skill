# Pre-Assembly Handoff Contract

- Every planned component is implemented, and its file, parent-child relationships, API evidence, and AI planning decisions resolve correctly.
- Minimum interactions, data models, semantic keys, resources, layout, text, and font references are implemented and pass the shared quality gates.
- Every design-static string is written to the component-owning module's `src/main/resources/base/element/string.json`; ETS references it through `$r('app.string.<name>')` without overwriting unrelated entries.
- Every PNG has a `resolved` boundary, its export node is not a layout slot, and its Image dimensions equal `imageDisplaySize`.
- The page shell does not implement the internals of overlays, collection items, input, media, or independent action regions.
- Cross-stage IDs satisfy the shared traceability contract.

Stop assembly and return to the owning stage when any requirement fails.
