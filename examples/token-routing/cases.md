# Token Routing Cases

This file validates abstract rules only. It does not define the specification.

## Repeated Options

The input contains three instances of the same component with copy `Option one`, `Option two`, and `Option three`; structure and interactions are identical.

Expected: generate one Semantic NodeDigest and deep-read only one representative initially. Preserve copy, variant, dimension, and selection-state differences for the other two instances without rereading identical reference code.

The script decides only which representative instance to read and must not classify the structure directly as List. AI still confirms the collection component from product semantics and ArkUI APIs.

## Distinct Visual Resources

Several content cards share a structure but have different `assetIdentity` values.

Expected: card structure may be reused. `perInstanceEvidenceRequired` must contain `assetIdentity`, and every visual resource continues through resource classification and boundary selection independently.

## Simple Independent Image

Node facts are complete. The target is an independent Image with no children, masks, or effects.

Expected: route to Fast and `metadata-only` without an additional `get_design_context` call.

Fast reuses only same-version image facts. AI still performs a compact review of the current resource identity and usage context.

## Masked Composite Resource

The node contains masks, shadows, multilayer vectors, or unresolved visual fields.

Expected: route to Deep and `staged-context`. Read the representative first and expand the relevant subtree incrementally only if visual closure remains unclear.

## Counterexamples

- Merge different variants because their node names match.
- Reread identical ArkUI List documentation for every list item.
- Copy a complete Figma REST node response into the analysis report.
- Reuse cached conclusions across tasks without `fileVersion`.
- Downgrade a masked or unknown image resource to Fast to save tokens.
- Convert Semantic routing directly into Tabs/List/Grid.
- Reuse a historical component choice directly after an ArkUI documentation cache hit.
- Let a geometry script decide multilayer visual closure from the smallest ancestor.
