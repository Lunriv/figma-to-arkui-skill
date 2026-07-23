# Cross-Stage Traceability and Return Contract

Retain stable ID references for every high-impact semantic block. The minimum chains are:

```text
Node → NodeDigest → DecisionPacket → Block → ArkUIEvidence → PlanningDecision → Component/File
TextNode → TextContentSpec → StringResourceDecision → Module/string.json → $r('app.string.<name>')
LayoutSlot → VisualSeeds → VisualClosure → ExportBoundary → PNG/Resource → ImageDisplaySize
FigmaProperty → VisualPropertySpec → PropertyDecision → VisualPropertyBinding → ArkUI property
ShadowEffect → ShadowSpec/Layer → ShadowDecision → ShadowBinding/Wrapper → `.shadow`
```

- Downstream stages reference upstream facts and decisions; they do not copy full MCP, REST, or ArkUI documentation payloads.
- For cache hits, record the version, source, and current-context revalidation. Cached facts cannot stand in for a decision by the current AI pass.
- Items marked `unresolved`, `manual-review`, or missing references cannot skip ahead to implementation or download. `skipped` omits only that item and must be disclosed in delivery.
- Return factual errors to node analysis; component/API/shadow-strategy/resource-classification errors to component selection; visual-closure or geometry errors to boundary selection; component-boundary, shadow-binding, state, and file errors to planning; download/pixel errors to asset download; and code or visual deviations to implementation.
- Never hide upstream errors with approximate drawing, resource substitution, or patches in planning, the page shell, or review.

The final delivery must trace any component, visual property, shadow, string, or image resource back to its Figma source, AI decision, implementation file, validation evidence, and unresolved items.
