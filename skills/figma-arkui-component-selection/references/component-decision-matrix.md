# Product Semantics to ArkUI Component Decision Matrix

| Semantics and structure | Preferred component | Required structure | Minimum interaction | Forbidden substitute |
| --- | --- | --- | --- | --- |
| Mutually exclusive tabs and content | Tabs | TabContent, custom tabBar | Tap/swipe switching synchronized with content | Handwritten tab state with Row/Column |
| Discrete indexed pages without tab labels | Swiper | Indexed child pages and evidence-backed indicator or controls | Swipe or controlled page switching synchronized with index | Horizontal List selected only from visual arrangement |
| Carousel with autoplay, looping, or page indicators | Swiper | Homogeneous or page-level children, index state, and proven playback settings | Page switching plus only the proven autoplay, loop, and indicator behavior | Timer-driven Row translation or continuous List |
| Ordered step flow with next, previous, skip, or finish actions | Swiper with explicit controls and index state | Ordered pages, controlled index, action boundaries, usually `disableSwipe(true)` when free swiping is not proven | Proven step actions and current-step synchronization | Deprecated Stepper/StepperItem or handwritten page stacking |
| Horizontal or vertical homogeneous collection | List | ListItem, data model, ForEach/LazyForEach | Real scrolling; update selection state when selectable | Repeated handwritten Row/Column items |
| Regular two-dimensional homogeneous collection | Grid | GridItem, data model, ForEach/LazyForEach | Real scrolling; update selection state when selectable | Manually wrapped Rows |
| Irregular-height masonry collection | WaterFlow | FlowItem, data model, ForEach/LazyForEach | Real scrolling and selection when proven | Regular Grid or manually balanced Columns |
| Pull-to-refresh collection | Refresh wrapping the selected collection component | Refresh state, refresh callback, and collection child | Pull gesture and refreshing-state synchronization | Refresh icon with no Refresh behavior |
| Single-line text input | TextInput | Placeholder, input state | Focus and input | Row + Text input simulation |
| Multiline or conversational input | TextArea | Placeholder, input state | Focus, input, and content growth | Row + Text input simulation |
| Search query input | Search | Query state, placeholder, and search/change event evidence | Focus, input, and proven submit/change behavior | TextInput with decorative search icon |
| Boolean check | Checkbox | State and change event | Toggle checked state | Text checkmark glyph |
| Mutually exclusive choice | Radio/RadioGroup or project equivalent | Selected value | Change selected value | Static border |
| Persistent binary setting | Toggle with Switch type or project equivalent | Boolean state and change event | Toggle setting state | Checkbox selected only from visual similarity |
| Bounded numeric range | Slider | Current value, range, step, and change event | Update the bounded value | Custom drag gesture without a capability gap |
| Rating input or indicator | Rating | Rating value, step, star count, and indicator state | Update rating unless proven read-only | Repeated icon row with handwritten hit testing |
| Increment and decrement quantity | Counter or project equivalent | Numeric state, bounds, increment, and decrement actions | Update value through both actions | Stepper or generic Slider |
| Determinate progress | Progress | Current value, total, and proven style | Reflect value changes | Static filled rectangle |
| Indeterminate loading | LoadingProgress | Loading state and visibility | Start/stop with loading state | Rotating image or determinate Progress without a value |
| Numeric count or short status attached to content | Badge | Content child and number or string value | Reflect value and visibility changes | Manually positioned Text and Circle |
| Compact single-choice option menu | Select | SelectOption model and selected index | Open options and update selection | Anchored Popup without arbitrary popup content requirements |
| Date, time, or finite wheel selection | DatePicker, TimePicker, TextPicker, or matching dialog API | Selected value, bounds or range, and acceptance behavior | Update or accept the selected value | Handwritten scrolling columns |
| Overflowing single-line text intended to scroll | Text with TextOverflow.MARQUEE or Marquee | One-line text, constrained width, and playback policy | Proven marquee playback | Manual translation animation |
| Bottom-attached modal panel with independent visibility and scrim or dismissal evidence | `.bindSheet` | Visibility state, content builder, and evidence-backed height or detents | Open, dismiss, and synchronize visibility | Simulated bottom panel with `Stack`/absolute positioning; generic custom dialog without a proven capability gap |
| Floating popup positioned from an explicit trigger component or anchor | `.bindPopup` | Binding on the anchor component, visibility state, and evidence-backed placement and offset | Open, dismiss, and synchronize visibility | Binding on the page root; anchored popup simulated with `Stack`/absolute positioning; `.bindSheet` |
| Multiple visible component drop shadows when `.shadow` accepts one options object | Nested transparent containers, one `.shadow` per wrapper | One geometry-preserving wrapper per shadow layer; original content remains innermost | None | Shadow array; repeated `.shadow` calls on one component; merged shadow; PNG fallback without an unsupported-property decision |
| Normal flow content | Row/Column/Flex | Space, padding, margin, alignment | None | Fixed-coordinate layout |
| Real overlay relationship | Stack | Corresponding overlay evidence | As required by semantic evidence | Full-page Stack for drawing convenience |

Current item count cannot override product semantics: selectable, scrollable, or data-driven homogeneous content remains a collection. This matrix only narrows candidates and cannot replace an AI decision. Read APIs for the most likely candidate first, then alternatives only if it cannot satisfy minimum interaction. Do not load an entire unrelated component-documentation set.

Prefer `.bindSheet` for `bottom-sheet` and `.bindPopup` for `anchored-popup`. The generic `Stack` row applies only to real overlays without native presentation semantics and cannot override these mappings.

Select `Swiper` only from discrete paging evidence such as an index, snapping, indicators, explicit page controls, autoplay, looping, or prototype page transitions. Continuous homogeneous scrolling remains `List`, labeled mutually exclusive content remains `Tabs`, wrapping normal flow remains `Flex`, and fixed heterogeneous content remains `Row` or `Column`.

`Stepper` and `StepperItem` are deprecated from API 22. Do not select them. Use `Swiper`, controlled index state, and explicit actions for a proven step flow.

Map backmost-to-frontmost shadow layers to outermost-to-innermost wrappers without sorting by numeric values. Keep wrappers transparent and layout-neutral, repeat the target border radius and size, and leave the background on the innermost content container only.
