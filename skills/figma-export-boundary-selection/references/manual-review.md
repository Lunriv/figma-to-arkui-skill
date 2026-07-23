# Batch Manual Review

Complete analysis for all resources, then output all problems once. Use this format for each item:

```text
- Resource: <semantic name>
  Figma: <openable node link>
  Problem: <one human-readable sentence>
  Choices: export current boundary / provide the correct image link / skip this resource
```

Do not include screenshots, raw node IDs, candidate trees, REST fields, or pixel-rounding details. Describe only facts that affect the decision, for example:

- The current boundary also contains the card background, and evidence does not prove that the background belongs to the image.
- The current boundary contains copy or another semantic icon.
- The image boundary contains coordinates or dimensions that are neither integers nor `.5` values.
- No independent boundary fully contains both the image and its glow.

Write the manual result back to `manualDecision`. Do not download any resource in the batch before all decisions are populated.
