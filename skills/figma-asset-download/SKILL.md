---
name: figma-asset-download
description: "Execute Png3x and Png3xFallback resource decisions that passed minimum-boundary selection, exporting through the Figma REST API into a HarmonyOS media directory. Use it for images, illustrations, textures, complex composites, and icon fallbacks without an exact IconFont match. Reject layout containers, unresolved boundaries, mapped IconFont resources, primitives, and temporary MCP resources."
---

# Figma 3x PNG Asset Export

Input `resourceDecision[]` and `exportBoundaryDecision[]`. Read the [Download Contract](references/download-contract.md), [Naming and Validation Contract](references/export-contract.md), and [Traceability Contract](../../references/traceability-contract.md). Process only `Png3x/Png3xFallback` resources with `resolved` boundaries.

## Workflow

1. Verify resource identity, boundary, display dimensions, name, and consuming components. Deduplicate only with complete identity and visual evidence.
2. Check `FIGMA_TOKEN` and stop if it is missing.
3. Run `scripts/download_figma_png.mjs`, explicitly passing the boundary report, decision ID, target `base/media` directory, and stable file name.
4. Export the selected node with the contract's fixed parameters. Validate the PNG, logical dimensions, and 3x pixels before writing it. Do not include temporary URLs in deliverables.
5. Output local resource mappings and update the resource decisions and traceability chain.

## Blocking Conditions

- Forbid `download_assets`, screenshots, temporary/remote URLs, Base64, text glyphs, and empty placeholder resources.
- Do not bypass the boundary report or download layouts, text, primitives, IconFont resources, non-resolved resources, or resources with unconfirmed visual closure.
- Export distinct or unknown `assetIdentity` values separately. Preserve the gap and stop the related implementation on failure.

This stage executes confirmed decisions only. Do not reinterpret resource semantics or boundaries.
