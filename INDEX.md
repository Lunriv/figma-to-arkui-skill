# Figma-to-ArkUI Subskill Index

Use this index after loading the root `SKILL.md`. Select the smallest valid stage set, then read each selected subskill's `SKILL.md` completely. A downstream stage cannot replace a missing prerequisite handoff.

| Order | Subskill | Load when | Required input | Primary output |
| --- | --- | --- | --- | --- |
| 1 | [`figma-evidence-routing`](skills/figma-evidence-routing/SKILL.md) | The request includes Figma nodes, multiple frames, repeated components, or a large tree. | Target Figma nodes | `nodeDigest[]`, routing summary, read log |
| 2 | [`figma-node-analysis`](skills/figma-node-analysis/SKILL.md) | Semantic, interaction, layout, text, visual-property, effect, or resource facts are needed. | Routing report and Figma evidence | `blockAnalysis[]`, `visualPropertySpec[]`, `shadowSpec[]`, `decisionPacket[]` |
| 3 | [`figma-arkui-component-selection`](skills/figma-arkui-component-selection/SKILL.md) | ArkUI components, visual properties, shadows, project resources, IconFont, or fonts must be selected. | Analysis report and decision packets | Component/API/property/shadow/resource/font decisions |
| 4 | [`figma-export-boundary-selection`](skills/figma-export-boundary-selection/SKILL.md) | A `Png3x` or `Png3xFallback` resource needs an export node. | Resource decisions and visual-closure evidence | `exportBoundaryDecision[]`, manual review batch |
| 5 | [`figma-arkui-plan`](skills/figma-arkui-plan/SKILL.md) | Files, component boundaries, state, strings, layout/property/shadow bindings, or implementation order must be planned. | Analysis, selection, and boundary reports | Planning, visual-property, shadow, string-resource, and traceability decisions |
| 6 | [`figma-asset-download`](skills/figma-asset-download/SKILL.md) | Resolved PNG decisions must become project media resources. | Resolved resource and boundary decisions | Validated local 3x PNG mappings |
| 7 | `hmos-arkui-develop-skill` | Planned ArkUI components and resources must be implemented. | Complete plan and resource mappings | Compilable components and module resources |
| 8 | [`figma-arkui-assemble`](skills/figma-arkui-assemble/SKILL.md) | Implemented components must be composed into a page shell. | Plan, components, resources, traceability | Final page assembly and handoff manifest |
| 9 | [`figma-arkui-review`](skills/figma-arkui-review/SKILL.md) | Implementation acceptance or regression review is required. | All reports, code, resources, and runtime results | Blocking pass/fail report and failure routing |

## Routing Shortcuts

- Full implementation: load stages 1 through 9 in order.
- Evidence-only analysis: load stages 1 and 2.
- Component or resource decision review: load stages 1 through 3, then stage 4 only for PNG candidates.
- Planning-only request: load stage 5 after verifying stages 2 through 4 already produced complete handoffs.
- Existing implementation review: load stage 9 and any upstream subskill required to reconstruct missing evidence; do not infer absent handoffs from code alone.

## Shared Resources

- `references/decision-authority.md`: boundaries between deterministic scripts, AI decisions, and validators.
- `references/quality-gates.md`: package-wide ArkUI acceptance requirements.
- `references/traceability-contract.md`: stable cross-stage IDs and return routing.
- `examples/`: fictional regression fixtures; load only for regression work or explicit examples.
