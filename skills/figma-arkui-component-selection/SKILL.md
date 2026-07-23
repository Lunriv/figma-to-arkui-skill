---
name: figma-arkui-component-selection
description: "Map product semantics, visual properties, and structural evidence from Figma node analysis to real components and properties backed by ArkUI documentation, and resolve project IconFont, image, font, and shadow capabilities. Use it before component planning to select controls, property APIs, bindSheet/bindPopup overlay presentations, nested-container multi-shadow strategies, and resource implementations. Do not use it to plan files or write ETS."
---

# Figma ArkUI Component Selection

Input one `decisionPacket` and its referenced facts at a time. Read the [Selection Contract](references/selection-contract.md) and [Shared Decision Authority](../../references/decision-authority.md). Read the [Component Matrix](references/component-decision-matrix.md), [Figma Property Mapping](references/figma-property-mapping.md), [Resource Resolution](references/resource-resolution.md), and [Quality Gates](../../references/quality-gates.md) as required by the target.

## Workflow

1. Derive candidates from semantic, layout, and interaction evidence. The matrix never decides the answer directly.
2. Invoke `hmos-arkui-develop-skill` to read current-SDK APIs and project usage for the preferred component and every requested visual property. Inspect alternatives only when the preferred API cannot preserve the proven semantics or property scope.
3. Deduplicate API evidence by SDK and component. Semantic blocks reference only evidence IDs.
4. Produce `arkuiEvidence[]`, `propertyDecision[]`, and `shadowDecision[]` from semantics, properties, APIs, SDK version, project capabilities, and instance differences. Record conditions, unsupported fields, trade-offs, and rejected alternatives.
5. Check project components/Code Connect, IconFont, primitives, and PNG in that order, then output `resourceDecision[]`. Do not select PNG export nodes in this stage.
6. Verify project fonts, output `fontDecision[]`, then generate deterministic `auditRequirements[]`.

For `bottom-sheet` and `anchored-popup`, read the current-SDK documentation for `.bindSheet` and `.bindPopup` first. Evaluate an alternative only when the preferred API cannot satisfy proven content, interaction, or SDK constraints, and record the exact capability gap. Do not switch to `Stack` or absolute positioning merely because custom drawing is direct.

For multiple component shadows, verify the current `.shadow` signature first. When it accepts only one `ShadowOptions` or `ShadowStyle`, select `nested-shadow-containers`: one transparent geometry-preserving wrapper and one `.shadow` call per visible layer. Do not select a PNG merely to avoid the required wrappers.

For icons, first search the target project with `rg` using the Figma semantic name, candidate English aliases, component references, and `fontFamily` usage. Follow declaration, import, and call relationships to confirm the actual resource organization. Never assume a fixed file name, member prefix, or static-member structure.

## Blocking Conditions

- Components require current API evidence and AI confirmation. Reuse only documentation from cache; revalidate the current SDK, instance, and interactions.
- Every `visualPropertySpec` must resolve to an `exact`, `conditional`, or `unresolved` `propertyDecision`. Do not omit, merge, or silently approximate visible properties.
- Accept an IconFont match as `exact` only when member declaration, font-family usage, semantics, and visual form are all confirmed. Normalized name similarity is only candidate evidence; otherwise use `Png3xFallback` or mark it `unresolved`.
- Do not statically simulate native components, omit minimum interactions, handwrite homogeneous items, merge distinct images, flatten multiple shadows, or silently substitute fonts.

Output the selection report. Send PNG decisions to boundary selection and all other decisions to planning. Do not create files or ETS code.
