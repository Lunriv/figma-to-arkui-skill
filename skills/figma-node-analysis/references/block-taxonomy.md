# Semantic Block and Structure Classification

## Product Semantics

| semanticRole | Evidence signals | Required capability |
| --- | --- | --- |
| PageShell | Page-level safe area, fixed layer, primary content region | Page composition and scrolling boundary |
| Navigation | Back action, path title, page-level action | Navigation event boundary |
| TabSwitcher | Mutually exclusive content states in one region, tab instances, or selected variants | Tab switching synchronized with content |
| Pager | Discrete page state, page snapping, next/previous actions, or page indicators without autoplay semantics | Indexed page switching synchronized with content |
| Carousel | Discrete repeated pages plus autoplay, looping, indicators, or promotional rotation evidence | Indexed page switching, optional autoplay, looping, and indicators |
| StepFlow | Ordered pages with current-step state and explicit next, previous, skip, or finish actions | Controlled indexed page switching and step actions |
| RefreshableCollection | A collection with pull displacement and refreshing state or a refresh interaction | Scrolling plus refresh state and callback |
| SelectableCollection | Homogeneous records, single/multiple selection variants, scrolling or growth | Collection rendering, scrolling, and selection state |
| DataCollection | Homogeneous records without selection state | Collection rendering and scrolling |
| SearchInput | Query input plus submit or query-change behavior | Search input state and submit/change events |
| InputComposer | Placeholder, cursor, input region, attachment, or send entry point | Focus, input, and submit boundary |
| ToggleControl | Checked, switched, selected, or expanded state | Local state toggle |
| BottomSheet | An independent panel attached to the viewport bottom, with modal evidence such as a scrim, top corner radius, drag handle, detents, or a dismiss action | Visibility, dismissal, and bottom-sheet boundaries |
| AnchoredPopup | A floating surface whose position depends on an explicit trigger component or anchor node, with relative placement, offset, or trigger evidence | Anchor, visibility, and dismissal boundaries |
| DialogOrSheet | Scrim, independent visibility, and confirm/cancel/dismiss actions, but insufficient evidence for BottomSheet or AnchoredPopup | Preserve the unresolved presentation type and action boundaries |
| ActionArea | Primary submit, save, delete, capture, or similar action | Tap event boundary |
| ContentSection | Independent heading, data source, empty state, or loading state | Content responsibility boundary |
| Feedback | Prompt, error, success, quota, or status feedback | Presentation state |
| Decorative | Non-semantic texture, lighting, or background | No interaction |
| Unknown | Insufficient evidence | Preserve the gap; do not implement inferred behavior |

## Collection Classification

Classify collections by semantics, with no item-count threshold. Mark a structure as a collection when any condition holds:

- Sibling items share a field structure or component instance.
- The container supports scrolling, clips subsequent content, or grows dynamically.
- Items have mutually exclusive or multiple-selection states.
- Figma variants or data representation prove they belong to one semantic collection.

Keep a normal heterogeneous Row/Column only when responsibilities differ, data models differ, order is fixed, and the structure does not scroll.

## Structural Evidence Priority

Actual parent-child relationships and Auto Layout > component instances, variants, and variables > prototypes and component descriptions > text and names > visual similarity. Lower-priority evidence must not override higher-priority facts.

Visual proximity to a component does not prove an anchor relationship. Record prototype triggers, component relationships, or verifiable relative-position evidence. Proximity to the viewport bottom alone does not prove a sheet; independent visibility plus scrim, dismissal, drag, or detent evidence is also required.

Horizontal repetition does not prove a pager or carousel. Require discrete page state, snapping, controls, indicators, autoplay, looping, or prototype page transitions. Continuous scrolling remains a collection; mutually exclusive labeled content remains a TabSwitcher; fixed heterogeneous content remains normal flow.
