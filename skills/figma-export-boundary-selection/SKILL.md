---
name: figma-export-boundary-selection
description: "Select the smallest complete and clean export node for Figma images and PNG fallback icons, then verify bounds, masks, effects, and visible siblings with read-only Figma REST node data. Use it after resource classification to separate layout slots from image boundaries, block incorrect container exports, and batch manual-review links. Do not download images or write ETS."
---

# Figma Export-Boundary Selection

Process only `Png3x` and `Png3xFallback`. Read the [Boundary Contract](references/boundary-contract.md), [Selection Rules](references/selection-rules.md), and [Shared Decision Authority](../../references/decision-authority.md). Read [Manual Review](references/manual-review.md) only when ambiguity appears.

## Workflow

1. Confirm `visualClosureDecision` for image content, effects, strokes, and masks from MCP evidence. Return to node analysis when evidence is insufficient.
2. Verify the subtree and geometry with the read-only `/v1/files/:fileKey/nodes` endpoint. Keep raw REST data out of model context.
3. Run `node scripts/resolve_export_boundaries.mjs --manifest "<boundary-input.json>"`, consuming only candidates and validity results.
4. Select the smallest common container inside the confirmed closure. Check layout-slot overlap, the half-pixel grid, and visible contamination.
5. Submit `manualReview[]` once after analyzing the full batch. Deliver only `resolved` items.

For offline verification, add `--node-data "<get-file-nodes-response.json>"`.

## Blocking Conditions

- Scripts must not add to or remove from visual closure. Mark missing AI decisions, nodes, or valid common containers as `unresolved`.
- The export node must not be a layout slot. Coordinates and dimensions accept only integers or `.5`, while still requiring completeness and purity.
- Forbid rounding, alpha trimming, or falling back to an ancestor containing unrelated semantic content.
- Send contamination or unknown visible content to batch manual review. Prompts include only the resource name, Figma link, problem, and choices.
- Do not download `manual-review`, `unresolved`, or unapproved contaminated items.

Output the boundary report. Do not create images or ETS code.
