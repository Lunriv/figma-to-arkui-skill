---
name: figma-node-analysis
description: "Analyze the complete descendants of one or more Figma frames or nodes and organize node evidence into semantic blocks, interactions, layout, text styles, visual properties, shadow layers, and visual-resource specifications. Use it before Figma-to-ArkUI conversion to identify screen states, native-control semantics, collections, input, overlays, effects, and resource types. Do not select ArkUI APIs or write code."
---

# Figma Node Analysis

Input the routing report and organize only facts proven by MCP evidence. Always read the [Analysis Contract](references/analysis-contract.md). Read the [Block Taxonomy](references/block-taxonomy.md) when semantic, collection, or interaction signals exist, and read [Evidence Capture](references/evidence-capture.md) for interaction, layout, text, or resource targets.

## Workflow

1. Build `nodeCoverage[]` from the node index, NodeDigests, and initial deep-read list. Read context in routed batches and expand instances on demand.
2. Supplement evidence with variables and Code Connect. Determine multi-node relationships first and output `screenVariantGroup[]`.
3. Divide `blockAnalysis[]` by user action. Prove layout relationships and complete default responsive calculations before filling interaction, text content/style, visual-property, shadow, and visual-resource specifications.
4. Generate `decisionPacket[]` for non-decorative semantic blocks, containing only fact references, differences, unknowns, and API topics.
5. Output `evidenceUsage` for actual reads, digest reuse, incremental expansion, and avoided reads, then run coverage checks.

## Blocking Conditions

- Write `unknown` for fields without evidence. Do not fill semantic conclusions from defaults, screenshot impressions, or routing risk.
- Classify collections by homogeneous, scrolling, selection, or data-driven semantics, never by item count. Record tabs, input, checks, and other control semantics independently.
- Preserve every Figma layout, text, visual property, and visible shadow property. Separate design-static copy from dynamic content. Layout specifications must include relationships, child roles, evidence, rejected relationships, and `320/375/480vp` tests. Reuse only invariants across repeated structures.
- Put every component shadow into `shadowSpec[]` and every visual candidate into `visualResourceSpec[]`. For images and fallback icons, separate layout slots, visual seeds, required nodes, and search roots.
- Page structure, control semantics, primary actions, and complex resources require high-impact decision packets confirmed by AI.

Send the analysis report and `decisionPacket[]` to component selection. Do not select ArkUI APIs, file trees, or ETS code.
