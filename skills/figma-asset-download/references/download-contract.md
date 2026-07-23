# Figma REST PNG Export Contract

## Input Eligibility

Resources must come from the component-selection report and satisfy all of the following:

- `implementation` is `Png3x` or `Png3xFallback`.
- A clear `visualResourceSpecId`, `boundaryDecisionId`, and `assetIdentity` exist, and the boundary decision is `resolved`.
- A `visualClosureDecisionId` confirmed by the current AI pass exists. Script candidates or valid geometry cannot replace this decision.
- `purityStatus` is `clean` or `manual-approved`, and `selectedExportNodeId` is not in `layoutSlotNodeIds`.
- `imageDisplaySize` exactly matches `selectedBounds.width/height`.
- The resource is not text, layout, Primitive, ExistingComponent, or IconFont.

## REST Constraints

- Read credentials only from the `FIGMA_TOKEN` environment variable. Never write them to arguments, scripts, logs, or the product project.
- The Figma URL must match `/design/:fileKey/` and include `node-id`. Convert `-` in the URL node ID to `:` for the REST API.
- Production export always calls `/v1/images/:fileKey` with `format=png&scale=3&contents_only=true&use_absolute_bounds=true`. `ids` must be the URL-encoded `selectedExportNodeId`.
- Use the image URL returned by REST only to download bytes immediately. Never place it in ETS, resource mappings, or delivery documentation.
- Stop when the token is missing, no export URL exists, HTTP fails, or the response is not PNG. Never fabricate success from another source.

## Identity and Deduplication

Download once only when `assetIdentity` is identical, visual content matches, and consuming crops are compatible. Export different image fills, source assets, or nodes with unconfirmed identity separately. Similar dimensions, names, collection positions, or semantic purposes are not sufficient evidence.

## Output

For each item output `resourceDecisionId | boundaryDecisionId | selectedExportNodeId | assetIdentity | local path | resourceName | imageDisplaySize | PNG pixel dimensions | consuming components | export settings`, and provide `Image($r('app.media.<resourceName>'))`.
