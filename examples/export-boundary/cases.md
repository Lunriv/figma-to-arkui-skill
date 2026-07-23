# Image Export-Boundary Cases

This file contains concrete regression cases only. It does not define abstract rules.

## Outer Layout Slot

- Layout slot: 135x30.
- Inner image: 16x16.
- Expected: select the inner image; PNG is 48x48 and ArkUI Image is 16x16.

## Image and Glow

- Image content: 15x15.
- Smallest common container for the glow and image: 20x20.
- Expected: select the 20x20 container; PNG is 60x60 and ArkUI Image is 20x20.

## Half-Pixel Values

- Boundary: x=0.5, y=1.5, width=15.5, height=15.5.
- Expected: continue completeness and purity validation. After passing, use 15.5x15.5 directly without reporting pixel rounding to the user.

## Non-Half-Pixel Values

- Any boundary value is 1.38 or 15.25.
- Expected: do not round or download; add it to the batch manual-review manifest.

## Contaminated Container

- The common container for the image and required glow also contains a card background or copy.
- Expected: provide the candidate Figma link, problem, and three choices without showing screenshots or raw node IDs.

## Batch Problems

- One page contains a non-half-pixel boundary, a contaminated container, and a missing visual node.
- Expected: aggregate all issues once after analysis and download nothing before the user's decisions.
