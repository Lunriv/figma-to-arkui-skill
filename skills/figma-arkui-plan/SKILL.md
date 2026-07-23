---
name: figma-arkui-plan
description: "Plan pages, components, builders, state, visual-property bindings, shadow wrappers, and resource usage from node analysis, ArkUI component selection, and image export-boundary reports. Use it before implementation to determine file ownership, module string resources, data models, interaction state, property bindings, multi-shadow bindings, Image dimensions, and implementation order. Consume existing evidence only; do not reselect components or boundaries or write ETS."
---

# Figma ArkUI Planning

Input analysis, component/API, visual-property, shadow, resource, boundary, font, and audit references for the current semantic block. Read the [Planning Contract](references/plan-contract.md), [Shared Decision Authority](../../references/decision-authority.md), [Quality Gates](../../references/quality-gates.md), and [Traceability Contract](../../references/traceability-contract.md). Return upstream when any input is missing.

## Workflow

1. Split the page shell, independent components, collection items, and builders by semantic responsibility. Use confirmed components and return conflicts to component selection.
2. Plan collection data models, semantic keys, local state for tabs, selection, input, checks, and scrolling, plus external event boundaries.
3. Map every design-static string to `src/main/resources/base/element/string.json` in the target component's owning module and output `stringResourceDecision[]`. Do not resource runtime data or user input.
4. Bind layout, visual properties, text, shadows, resources, and resolved boundaries to components and output `planningDecision[]`. Use `layoutBinding[]`, `visualPropertyBinding[]`, and `shadowBinding[]` to trace every ArkUI property to a specific fact and list forbidden substitutes.
5. Limit scripts to topological sorting, ID binding, and missing-reference checks. Generate implementation order and `traceability[]`.

## Blocking Conditions

- The page shell owns composition only. Do not merge independent responsibilities merely because they are visually adjacent.
- Component boundaries, layout strategy, and state ownership require recorded AI planning decisions. Block unsupported `SpaceBetween`, `layoutWeight`, mixed spacing, or responsive scaling. Never silently resolve an `unresolved` item.
- Image display dimensions must reference boundary decisions only. Static copy requires an in-module string-resource decision. Homogeneous rendering, interactions, layout, text, and shadows must satisfy the shared gates.

Send only `resolved` resources to download and pass the component plan to the ArkUI implementation skill.
