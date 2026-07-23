# Resource Naming and Validation

- Media file names use only lowercase letters, digits, and underscores. When omitted, the script generates `figma_<node-prefix>_<node-suffix>_3x.png`.
- The default directory is `entry/src/main/resources/base/media/`. When module context exists, explicitly pass the target module's `src/main/resources/base/media/` directory.
- Display width and height must come only from `exportBoundaryDecision.imageDisplaySize`. Do not use stale dimensions from a layout slot or visual leaf.
- Integer logical dimensions require PNG pixels to be exactly 3x. A `.5` logical dimension allows either adjacent integer around its 3x value. Reject every other result.
- Reject overwriting same-name files by default. Use `--overwrite` only when source identity matches and an explicit refresh is intended.
- When one resource serves multiple components, name it by a stable semantic purpose. Never merge different `assetIdentity` values for naming convenience.

Example:

```bash
node scripts/download_figma_png.mjs \
  --boundary-manifest "<boundary-report.json>" \
  --decision-id "<boundaryDecisionId>" \
  --output-dir "<module/src/main/resources/base/media>" \
  --file-name "<stable-resource-name>.png"
```
