# Static Audit Manifest Contract

Review merges `textContentSpec[]`, `auditRequirements[]`, `componentPlan[]`, `stringResourceDecision[]`, and `exportBoundaryDecision[]` into temporary JSON without writing it to the product project:

```json
{
  "decisionAuthorities": [
    {
      "id": "stable-decision-id",
      "decisionPacketId": "decision-packet-id",
      "impact": "high | medium | low",
      "decisionDomains": ["business-semantic | layout-strategy | interaction | component-boundary | visual-style | visual-closure | arkui-api | resource-identity"],
      "aiDecisionRequired": true,
      "decisionMaker": "ai",
      "aiDecisionStatus": "confirmed | unresolved",
      "decisionProvenance": "fresh-ai-review | cached-evidence-revalidated",
      "contextDeltaChecked": true,
      "documentEvidenceIds": ["arkui-document-evidence-id"]
    }
  ],
  "requirements": [
    {
      "id": "stable-audit-id",
      "decisionAuthorityIds": ["corresponding-ai-decision-id"],
      "sourceFiles": ["ETS-file-relative-to-project-root"],
      "requiredComponents": ["ArkUI-component-name"],
      "requiredInteractions": ["tabs-change | item-selection | input | toggle | scroll"],
      "requiredPresentationApi": "bindSheet | bindPopup | none",
      "requiredBindingHostSourceNodeIds": ["figma-anchor-node-id"],
      "requiredPropertyDecisionIds": ["property-decision-id"],
      "visualPropertyBindingIds": ["visual-property-binding-id"],
      "requireForEach": true,
      "forbidTextGlyphFallback": true,
      "forbidFixedBlank": true
    }
  ],
  "layoutSpecs": [
    {
      "layoutId": "stable-layout-id",
      "axis": "horizontal | vertical | two-dimensional | overlay",
      "relation": "packed-fixed-gap | space-between | flex-remainder | scroll-fixed-gap | grid-fixed-gap | overlay",
      "container": {
        "mainSizeMode": "fixed | fill | content | viewport",
        "designMainSize": 375,
        "padding": { "before": 16, "after": 16, "crossBefore": 0, "crossAfter": 0 }
      },
      "crossAlignment": "start | center | end | stretch",
      "gap": 6,
      "children": [],
      "evidence": [],
      "rejectedRelations": [],
      "responsiveTests": [320, 375, 480],
      "clipping": true,
      "scrolling": true,
      "overlayEvidence": []
    }
  ],
  "layoutBindings": [
    {
      "layoutBindingId": "stable-binding-id",
      "layoutId": "stable-layout-id",
      "componentId": "component-id",
      "targetBuilder": "builder-name",
      "arkuiStrategy": "scroll-fixed-gap",
      "propertyBindings": [
        { "target": "List", "property": "space", "value": 6, "factPath": "gap" }
      ],
      "forbiddenProperties": ["child.margin", "layoutWeight"],
      "testWidths": [320, 375, 480]
    }
  ],
  "textContents": [
    {
      "id": "text-content-fact-id",
      "value": "Original Figma copy",
      "usage": "display | option-label | placeholder | accessibility-label",
      "origin": "design-static | runtime-dynamic | user-input"
    }
  ],
  "stringResources": [
    {
      "id": "stable-string-resource-id",
      "textContentSpecIds": ["text-content-fact-id"],
      "componentId": "component-id",
      "targetModule": "page-owning-module",
      "sourceFiles": ["ETS-file-relative-to-project-root"],
      "resourceFile": "module/src/main/resources/base/element/string.json",
      "resourceName": "page_section_label",
      "value": "Original Figma copy"
    }
  ],
  "resourceBoundaries": [
    {
      "id": "stable-boundary-id",
      "decisionStatus": "resolved | skipped",
      "purityStatus": "clean | manual-approved",
      "manualDecision": "empty string, accept-current-boundary, or skip-resource",
      "layoutSlotNodeIds": ["internal-node-id"],
      "selectedExportNodeId": "internal-node-id",
      "visualClosureDecisionId": "ai-visual-closure-decision-id",
      "visualClosureDecisionStatus": "confirmed",
      "selectedBounds": { "x": 0, "y": 0, "width": 16, "height": 16 },
      "imageDisplaySize": { "width": 16, "height": 16 }
    }
  ]
}
```

Run:

```bash
node scripts/audit_arkui_semantics.mjs --project-root "<project-root>" --manifest "<temporary-manifest.json>"
```

`decisionAuthorities`, `layoutSpecs`, `layoutBindings`, `textContents`, `stringResources`, and `resourceBoundaries` must exist. Pass an empty array when a category has no entries. Legacy manifests are incompatible and must be regenerated from current analysis and planning.

The script requires every `design-static` text to map exactly once and dynamic text not to map. It checks that static text exists in the owning module's `src/main/resources/base/element/string.json`, values match, and ETS uses `$r('app.string.<name>')`; it rejects `Text('...')` and inline placeholders. When `requiredPresentationApi` is `bindSheet` or `bindPopup`, source code must contain the corresponding binding; `bindPopup` also requires non-empty anchor evidence IDs. The script does not infer complete consistency between actual ETS and `layoutBinding`, `visualPropertyBinding`, or the anchor component through an incomplete AST. Review still compares properties, forbidden items, and local screenshots builder by builder. A nonzero script exit means review failure.
