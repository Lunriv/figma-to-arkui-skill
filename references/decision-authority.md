# Decision Authority and Evidence Boundaries

| Role | May | Must not |
| --- | --- | --- |
| Deterministic script | Output node/property/effect facts, structural fingerprints, candidates, IconFont member declarations and usage, geometry, PNG facts, and static audit results | Decide product semantics, components, component boundaries, layout or visual-style strategy, or visual closure |
| AI | Decide semantics, components, responsive layout, scrolling, decomposition, state, shadow strategy, resource classification, and visual closure from the current semantic block and API evidence | Guess when evidence is insufficient or substitute token routing for judgment |
| Validation script | Reject missing evidence, invalid dimensions, unauthorized decisions, or incomplete traceability | Declare a valid candidate the best semantic fit merely because it passes validation |

## Decision Packets

Page structure, control semantics, primary actions, multilayer or masked resources, and layouts affecting multiple downstream consumers are high-impact decisions that require confirmation by the current AI pass. Use one compact `decisionPacket` per semantic block. Reference only fact IDs, instance differences, unknowns, and API topics; expand on demand and gather more evidence when evidence is insufficient.

## Cache and Token Use

- Cache Figma/project facts and ArkUI documentation, not final choices detached from the current context.
- On a cache hit, still verify instance differences, SDK version, product actions, and minimum interactions. Invalidate the cache when the version or project capabilities change.
- Save tokens with representative nodes, decision packets, and on-demand expansion. Preserve conflicts and unknowns with priority.
- `versioned-cache` and Fast/Semantic/Deep change only read cost; they never change `aiDecisionRequired` or semantic confidence.
