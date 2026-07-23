---
name: figma-arkui-assemble
description: "Assemble ArkUI semantic components implemented from a component plan into a page shell while preserving native component semantics, minimum interface interactions, layout specifications, text styles, and string/image resource mappings. Use it for final page composition, not for reselecting components or patching child components inside the page shell."
---

# Figma ArkUI Page Assembly

Input the plan, all decisions/evidence, resource mappings, traceability chains, and implemented components. Read the [Handoff Contract](references/handoff-contract.md), [Quality Gates](../../references/quality-gates.md), and [Traceability Contract](../../references/traceability-contract.md).

- Limit the page shell to safe areas, fixed/scrolling layers, and semantic component ordering. Do not reselect components or reinterpret product behavior.
- Apply layout, text, fonts, minimum interactions, and local resources exactly as planned. Use only `$r('app.string.<name>')` for static copy and only resolved boundaries for Image dimensions.
- Stack/position, Blank, and every component implementation must satisfy the shared quality gates.
- Return ownership, component, interaction, layout, or resource errors upstream. Do not patch them in the page shell.

Complete `traceability[]` after assembly and hand it to review.
