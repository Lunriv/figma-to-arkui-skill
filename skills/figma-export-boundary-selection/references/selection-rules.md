# Export-Boundary Selection Rules

## Visual Closure

Visual closure contains everything required to form one image:

- Image fills or bitmap nodes.
- Vectors, Boolean operations, and decorative graphics.
- Inseparable glow, gradient, stroke, and shadow nodes.
- Masks and masked content that determine the final shape.

Layout-only backgrounds, hit targets, copy, badges, and sibling nodes belonging to other semantic actions cannot enter visual closure automatically.

Visual closure is an AI decision based on MCP semantics. Scripts may list parent-child relationships, effects, and candidate ancestors, but must not interpret "geometrically smaller" as "semantically part of the same resource."

## Smallest Common Container

1. When one visual seed is complete by itself, select that node.
2. With multiple required visual nodes, select their deepest common ancestor within the search root.
3. The candidate must fully contain the rendered bounds of every required node and must not equal any layout-slot node.
4. Do not abandon a smaller complete semantic node because an ancestor has neater dimensions.
5. Stop when no valid candidate exists. Do not fall back to a page, card, list item, or hit target.

Apply these rules only to AI-confirmed `requiredVisualNodeIds`; they cannot modify visual closure in reverse.

## Half-Pixel Grid

Validate `x`, `y`, `width`, and `height` from the candidate's `absoluteBoundingBox` independently:

```text
abs(value * 2 - round(value * 2)) <= 0.0001
```

After validation, remove only REST floating-point noise and normalize to the nearest `.5`. Do not round real values such as `1.38` to a half pixel. A `.5` value proves only numeric validity, not correct node semantics.

## Purity

- Ancestor paths from the candidate to each required node, plus descendants of the required nodes, belong to the allowed closure.
- Mark the candidate contaminated when it has undeclared visible fills, strokes, or effects.
- Mark the candidate contaminated when it contains visible text, images, vectors, backgrounds, or masks outside the closure.
- A structural frame/group without visible fills, strokes, or effects may serve as a transparent wrapper.
- Do not automatically accept or reject contamination; send it to manual review.

Do not infer boundaries through PNG alpha trimming. Transparent padding in the PNG belongs to the selected node's design content.
