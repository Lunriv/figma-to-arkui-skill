---
name: figma-to-arkui
description: "Convert one or more Figma frames or nodes into production HarmonyOS ArkUI pages with evidence-backed semantics, responsive layout, minimum interactions, module-owned string resources, exact project resource reuse, verified 3x PNG export boundaries, and blocking implementation review. Use for full Figma-to-ArkUI delivery or any package stage such as node analysis, ArkUI component selection, asset export, implementation planning, page assembly, or design parity review."
---

# Figma-to-ArkUI

Treat Figma as evidence for product semantics, structure, interaction, layout, text, and resources. Do not reproduce the design layer by layer or simulate controls with static layouts.

## Skill Root

Resolve the skill root from the directory containing this `SKILL.md`. Never hardcode an installation path. If the loaded file path is unavailable, locate the directory containing all of `SKILL.md`, `INDEX.md`, `skills/`, and `references/`.

Resolve every package path relative to that root.

## Progressive Loading

1. Read [INDEX.md](INDEX.md) to identify the required subskills and their dependency order.
2. Read each selected `skills/<name>/SKILL.md` completely before executing that stage.
3. Read only the references required by that subskill and the current evidence.
4. Run bundled scripts from the owning subskill directory; do not copy or reinterpret their deterministic logic.

For complete Figma-to-ArkUI delivery, load every subskill in the strict workflow order below. For a stage-specific request, load only that subskill and any missing prerequisite subskills named in `INDEX.md`.

Before making decisions, read [Decision Authority](references/decision-authority.md), [Quality Gates](references/quality-gates.md), and the [Traceability Contract](references/traceability-contract.md).

## Workflow

1. Read [Evidence Routing](skills/figma-evidence-routing/SKILL.md) to generate NodeDigests and a tiered read plan.
2. Read [Node Analysis](skills/figma-node-analysis/SKILL.md) to produce semantic blocks, interactions, evidence-backed layout relationships, text content/styles, visual-property specifications, and resource facts.
3. Read [Component Selection](skills/figma-arkui-component-selection/SKILL.md) to verify ArkUI APIs and decide component, visual-property, resource, and font implementations.
4. Read [Export Boundary Selection](skills/figma-export-boundary-selection/SKILL.md) to select the smallest complete PNG boundaries and batch ambiguous cases.
5. Read [Implementation Planning](skills/figma-arkui-plan/SKILL.md) to plan component boundaries, files, state, data models, string resources, layout and visual-property bindings, and implementation order.
6. Read [Asset Download](skills/figma-asset-download/SKILL.md) to export production 3x PNGs for resolved boundaries.
7. Invoke `hmos-arkui-develop-skill`; merge the owning module's `string.json` from `stringResourceDecision[]`, implement static copy with `$r('app.string.<name>')`, and build the planned components.
8. Read [Page Assembly](skills/figma-arkui-assemble/SKILL.md) to compose implemented components into the page shell.
9. Read [Blocking Review](skills/figma-arkui-review/SKILL.md) to run deterministic constraints plus code, resource, interaction, responsive, and visual checks.

Each stage consumes only structured handoffs. Return invalid evidence or decisions to the owning stage instead of approximating them during implementation, assembly, or review.

## Evidence Rules

- Use the authenticated Figma MCP for semantic and structural evidence. Start with `get_metadata`, then read design context, variables, and Code Connect according to the routing plan.
- Use the read-only Figma REST nodes endpoint only to verify image geometry. Export approved production assets through the images endpoint with `format=png`, `scale=3`, and `FIGMA_TOKEN`.
- Read ArkUI documentation by candidate component and target SDK. Cache facts, not decisions detached from the current project and node context.
- Use screenshots only for post-implementation comparison, never as layout input.
- Preserve local design constants. Only evidence-backed flexible regions may absorb remaining width; equal spacing in one state does not prove `SpaceBetween`.

## Examples and Delivery

Read files under `examples/` only for regression work or when the user requests an example. They are fictional fixtures, not default implementation context.

The final report must include the routing summary, AI decisions, component tree, minimum interactions, visual-property and shadow mappings, string/image/font resources, unimplemented external behavior, validation results, unresolved items, and shared traceability chain. Never claim completion while a quality gate fails.
