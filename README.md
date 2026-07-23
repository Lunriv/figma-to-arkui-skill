# Figma to ArkUI

English | [简体中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A skill for converting Figma designs into production-ready HarmonyOS ArkUI code through semantic analysis.

Instead of reproducing Figma layers one by one, it first identifies product semantics, component relationships, interaction states, layout constraints, and asset boundaries, then maps that evidence to ArkUI components and project code.

## Quick Start

### Install in 30 Seconds

Install with the Agent Skills installer:

```bash
npx skills add Lunriv/figma-to-arkui-skill
```

In the interactive prompt, select the root `figma-to-arkui` skill and the agent runtimes where you want to install it. Do not install the subskills under `skills/` separately; the root skill contains and orchestrates them.

For runtimes that do not support the installer, clone the [GitHub repository](https://github.com/Lunriv/figma-to-arkui-skill.git) into the runtime's skill discovery directory:

```bash
git clone https://github.com/Lunriv/figma-to-arkui-skill.git /path/to/skills/figma-to-arkui
```

For either method, make sure the runtime can discover the repository's root `SKILL.md`.

### Prerequisites

1. Connect the Figma plugin to your model and sign in with an account that can access the target Figma nodes.
2. Set a Figma Personal Access Token in the `FIGMA_TOKEN` environment variable. The token is used only to export approved image assets through the Figma REST API. Do not commit it to the repository.
3. Install [`hmos-arkui-develop-skill`](https://gitcode.com/openharmony-skills/hmos-arkui-develop-skill) to look up ArkUI and HarmonyOS APIs and implement the generated code.
4. Prepare a HarmonyOS project that the model can read, modify, and validate.

For example, set the token in the current zsh session:

```bash
export FIGMA_TOKEN="<your-figma-token>"
```

### Usage

From the target HarmonyOS feature directory, invoke the Figma plugin and this skill, then provide:

- one or more Figma links containing `node-id`;
- the project location to create or modify;
- the page or component to implement.

Example prompt:

```text
Use the Figma plugin and figma-to-arkui to implement the following nodes in the current HarmonyOS project:

- Figma node: <node-link-1>
- Figma node: <node-link-2>
- Output path: <module/src/main/ets/...>
- Target: <page or component description>
```

The skill proceeds through evidence collection, semantic analysis, component selection, asset handling, code implementation, and quality review.

## Why Semantic Analysis

Figma layers describe a visual result, not an application's component structure. Visually similar regions may represent tabs, lists, inputs, overlays, or plain containers. Reproducing only coordinates and layers usually creates a static page with missing interactions, weak responsiveness, and incorrect ArkUI semantics.

Before generating code, this skill determines:

- What product responsibility does this region have?
- Should it use a native ArkUI component, an existing project component, or an image asset?
- Which design states prove selection, scrolling, input, overlay, or other interactions?
- Which dimensions are fixed, and which relationships require responsive layout?
- How should images, icons, fonts, shadows, and strings enter the HarmonyOS project?

Semantic decisions remain traceable to Figma node evidence, ArkUI API evidence, and the final implementation. When evidence is insufficient, the workflow returns to the responsible stage instead of silently guessing in code.

## Workflow

| Stage | Subskill | Responsibility |
| --- | --- | --- |
| 1 | `figma-evidence-routing` | Build node digests, detect repeated structures, and plan incremental reads. |
| 2 | `figma-node-analysis` | Analyze semantic blocks, interactions, layout, text styles, and visual assets. |
| 3 | `figma-arkui-component-selection` | Select ArkUI components and project resources from semantic and API evidence. |
| 4 | `figma-export-boundary-selection` | Select the smallest complete and clean export boundary for each PNG asset. |
| 5 | `figma-arkui-plan` | Plan components, files, state, string resources, property bindings, and implementation order. |
| 6 | `figma-asset-download` | Export and validate 3x PNG assets through the Figma REST API. |
| 7 | `hmos-arkui-develop-skill` | Look up current API evidence and implement ArkUI components. |
| 8 | `figma-arkui-assemble` | Assemble the components into the final page. |
| 9 | `figma-arkui-review` | Apply blocking reviews for semantics, interactions, layout, resources, and visual parity. |

A complete page implementation runs every stage in order. Node analysis, component selection, and implementation review requests load only the required stages and their upstream dependencies.

## Core Principles

- Treat Figma as evidence for product semantics, structure, interaction, layout, and assets rather than mechanically reproducing layers.
- Prefer native ArkUI or existing project components for tabs, lists, inputs, selections, and overlays.
- Preserve the minimum interactions demonstrated by the design without inventing unsupported product behavior.
- Prove layout relationships before choosing ArkUI layout properties, then validate them at 320, 375, and 480 vp.
- Prefer existing project components, Code Connect mappings, and exact IconFont matches; use PNG fallback only when no match exists.
- Store static design copy in the owning module's `string.json` and reference it through `$r('app.string.<name>')`.
- Export images at 3x only from approved minimum boundaries, avoiding rasterized layout containers.
- Do not report completion while a quality gate is failing; return the issue to the stage responsible for the decision.

## Skill Structure

The repository uses one root skill to orchestrate progressively loaded subskills:

```text
figma-to-arkui/
├── SKILL.md                         # Root entry point and complete workflow
├── INDEX.md                         # Subskill routing index
├── references/                      # Shared quality gates and traceability contracts
├── examples/                        # Regression fixtures
└── skills/
    ├── figma-evidence-routing/
    ├── figma-node-analysis/
    ├── figma-arkui-component-selection/
    ├── figma-export-boundary-selection/
    ├── figma-arkui-plan/
    ├── figma-asset-download/
    ├── figma-arkui-assemble/
    └── figma-arkui-review/
```

The runtime only needs to discover the root `SKILL.md`. The root skill uses `INDEX.md` to select the subskills required for the current task. Each subskill then reads its own reference contracts and runs deterministic scripts as needed, avoiding the cost of loading the entire package at once.

## Requirements

- An agent runtime that supports directory-based skills and progressive loading;
- an authenticated Figma plugin connection with access to the target nodes;
- the `FIGMA_TOKEN` environment variable;
- `hmos-arkui-develop-skill`;
- Node.js;
- a HarmonyOS project available for implementation, compilation, and visual validation.

## Validation

Run all deterministic tests from the repository root:

```bash
node --test \
  skills/figma-evidence-routing/scripts/route_node_digests.test.mjs \
  skills/figma-export-boundary-selection/scripts/resolve_export_boundaries.test.mjs \
  skills/figma-asset-download/scripts/download_figma_png.test.mjs \
  skills/figma-arkui-review/scripts/audit_arkui_semantics.test.mjs \
  skills/figma-arkui-review/scripts/validate_layout_constraints.test.mjs
```

The workflow reports completion only after deterministic audits, ArkUI validation, responsive checks, visual comparison, and all shared quality gates pass.

## License

Licensed under the [Apache License 2.0](LICENSE).
