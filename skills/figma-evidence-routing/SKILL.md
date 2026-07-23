---
name: figma-evidence-routing
description: "Build compact NodeDigests, structural fingerprints, and a tiered read plan before Figma node analysis. Use it for multiple frames/nodes, repeated components, or large node trees to reduce duplicate design context, ArkUI documentation, and REST data in model context while routing semantically, visually, or structurally ambiguous nodes to deep reads."
---

# Figma Evidence Compression and Routing

Input Figma root nodes and decide only the evidence read scope. Read the [Routing Contract](references/routing-contract.md). Read the [Token Policy](references/token-policy.md) only when adjusting cache or read cost. Script responsibilities follow [Shared Decision Authority](../../references/decision-authority.md).

## Workflow

1. Call `get_metadata` on root nodes to build an index and identify semantic blocks, instances, variants, collection representatives, input regions, and resource candidates. Do not copy raw REST payloads, reference code, or long text.
2. Run `node scripts/route_node_digests.mjs --manifest "<node-facts.json>"` to generate structural fingerprints, duplicate groups, read routes, and the initial deep-read list.
3. Call `get_design_context` only for `initialContextNodeIds`. Reuse structural evidence for repeated instances while preserving instance differences.
4. Expand incrementally only when `expandWhen[]` matches or evidence conflicts.
5. Output `nodeDigest[]`, `routingSummary`, and the actual read log.

## Blocking Conditions

- Fingerprints must not use node IDs, absolute coordinates, names, or copy. Use components, variants, types, subtree shapes, and semantic/visual signals.
- Without a stable `fileVersion`, limit caching to the current request. Repeated instances must not inherit copy, variables, state, dimensions, or resource identity.
- Masks, effects, blends, unknown visible content, and evidence conflicts require Deep routing.
- Routing and caching are not semantic conclusions. Keep `aiDecisionRequired: true` for every target.

Deliver only the routing report to `figma-node-analysis`. Do not create ETS code or resources.
