---
name: figma-arkui-review
description: "Review an ArkUI implementation against its Figma evidence with hard gates for product semantics, real components, visual-property mappings, minimum interactions, strings, icon/image resources, shadows, boundaries, layout, fonts, repeated rendering, and Blank usage. Use it for blocking acceptance after implementation; on failure, return to node analysis, component selection, boundary selection, planning, resource download, or implementation."
---

# Figma ArkUI Blocking Review

Input all reports, code, resource mappings, and runtime results. Read the [Review Checklist](references/review-checklist.md), [Audit Manifest Contract](references/audit-manifest-contract.md), [Quality Gates](../../references/quality-gates.md), [Traceability Contract](../../references/traceability-contract.md), and [Decision Authority](../../references/decision-authority.md).

## Review

1. Verify evidence coverage, AI decisions, API evidence, and all traceability references.
2. Check component semantics, visual-property mappings, minimum interactions, collection rendering, string/image resources, shadows, boundaries, layout, and text gates item by item. Compare actual properties with `layoutBinding`, `visualPropertyBinding`, and `shadowBinding` for every builder.
3. Merge upstream reports, string-resource decisions, and boundary decisions into a temporary audit manifest, then run `scripts/audit_arkui_semantics.mjs`. Return string or layout validation failures immediately to their owning stage.
4. Run the ArkUI skill's API and syntax checks plus any compilation validation supported by the project.
5. After implementation, compare runtime results with local Figma screenshots at the 375 vp visual baseline and 320/480 vp responsive states. Verify regions, spacing, fonts, cropping, and interaction states.

## Failure Routing

- Evidence or digest error -> node analysis; component/API/property-mapping/IconFont/font/shadow-strategy error -> component selection; visual-closure/boundary error -> boundary selection.
- Component-boundary, visual-property-binding, shadow-binding, state, file, string-module/naming, or traceability error -> planning; PNG identity, download, or pixel error -> asset download; `string.json` merge, resource reference, code/API, or visual deviation -> implementation.
- When a script exceeds its authority, return to the stage that produced the conclusion. Do not apply approximate fixes in review or the page shell.

Output `pass` only after the audit, ArkUI validation, visual comparison, and all shared gates pass.
