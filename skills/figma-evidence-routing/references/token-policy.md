# Token Usage Policy

## Lowest-Cost Evidence Path

1. Use `get_metadata` to build the node and dimension index.
2. Use `get_design_context` only for representatives, conflicts, and nodes required by routing.
3. Leave REST data and PNG pixels/hashes to scripts. Deduplicate ArkUI documentation by final candidate and SDK.

## Reuse Boundaries

- Without `fileVersion`, reuse only within the current request. Persistent caching requires `fileKey + fileVersion + structuralFingerprint`.
- Reuse only structure and APIs across component instances. Verify copy, variables, state, dimensions, and image identity per instance.
- `get_metadata` cannot prove complete fills, effects, masks, or interactions. Zero-deep-read is limited to Code Connect, evidence already read in the same request, or a same-version cache.
- Cache facts, not final decisions. Expand the current instance on conflict.

Do not deep-read the full page root, reread homogeneous items, put complete REST/API payloads into handoffs, or derive semantic and implementation conclusions from node count, `route`, or `routingRisk`.
