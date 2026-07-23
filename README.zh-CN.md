# Figma to ArkUI

[English](README.md) | 简体中文

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

一套基于语义分析，将 Figma 设计转换为生产级 HarmonyOS ArkUI 代码的 Skill。

它不会逐层照搬 Figma 图层，而是先识别页面中的产品语义、组件关系、交互状态、布局约束和资源边界，再将这些证据映射为 ArkUI 组件与工程代码。

## 快速开始

### 30 秒安装

使用 Agent Skills 安装器：

```bash
npx skills add Lunriv/figma-to-arkui-skill
```

在交互提示中选择根 `figma-to-arkui` Skill，以及需要安装到的智能体运行时。不要单独安装 `skills/` 下的子技能，根 Skill 已包含并编排它们。

如果运行时不支持该安装器，可将 [GitHub 仓库](https://github.com/Lunriv/figma-to-arkui-skill.git) 克隆到其 Skill 发现目录：

```bash
git clone https://github.com/Lunriv/figma-to-arkui-skill.git /path/to/skills/figma-to-arkui
```

无论采用哪种方式，都需要确保运行时能够发现仓库根目录中的 `SKILL.md`。

### 使用前准备

1. 将 Figma 插件接入所使用的模型，并登录有权访问目标 Figma 节点的账号。
2. 将 Figma Personal Access Token 写入环境变量 `FIGMA_TOKEN`。该 Token 仅用于通过 Figma REST API 导出已确认的图片资源，请勿提交到仓库。
3. 安装 [`hmos-arkui-develop-skill`](https://gitcode.com/openharmony-skills/hmos-arkui-develop-skill)，用于检索 ArkUI 与 HarmonyOS API 并完成代码实现。
4. 准备一个可供模型读取、修改和验证的 HarmonyOS 工程。

以 zsh 为例，可在当前终端设置 Token：

```bash
export FIGMA_TOKEN="<your-figma-token>"
```

### 使用

在目标 HarmonyOS 功能目录下调用 Figma 插件和本 Skill，并提供：

- 一个或多个包含 `node-id` 的 Figma 链接；
- 需要生成或修改的工程位置；
- 页面或组件的实现目标。

示例提示词：

```text
使用 Figma 插件和 figma-to-arkui，将以下节点实现到当前 HarmonyOS 工程中：

- Figma 节点：<node-link-1>
- Figma 节点：<node-link-2>
- 生成位置：<module/src/main/ets/...>
- 实现目标：<页面或组件说明>
```

提交任务后，Skill 会按证据读取、语义分析、组件选择、资源处理、代码实现和质量审查的顺序执行。

## 为什么需要语义分析

Figma 图层描述的是设计结果，不等同于应用的组件结构。外观相似的区域，可能分别是页签、列表、输入框、弹层或普通容器；如果只按坐标和图层复刻，通常会得到缺少交互、难以适配且不符合 ArkUI 语义的静态页面。

本 Skill 会先回答以下问题，再生成代码：

- 这个区域在产品中承担什么职责？
- 它应使用原生 ArkUI 组件、项目已有组件，还是图片资源？
- 哪些设计状态证明了选择、滚动、输入、弹层等交互？
- 哪些尺寸是固定值，哪些关系需要响应式布局？
- 图片、图标、字体、阴影和字符串应如何进入 HarmonyOS 工程？

语义结论会与 Figma 节点证据、ArkUI API 依据和最终实现保持可追踪关系；证据不足时，流程会返回对应阶段，而不是在代码中静默猜测。

## 工作流

| 阶段 | 子技能 | 职责 |
| --- | --- | --- |
| 1 | `figma-evidence-routing` | 构建节点摘要，识别重复结构并规划增量读取。 |
| 2 | `figma-node-analysis` | 分析语义块、交互、布局、文本样式与视觉资源。 |
| 3 | `figma-arkui-component-selection` | 基于语义与 API 证据选择 ArkUI 组件和工程资源。 |
| 4 | `figma-export-boundary-selection` | 为 PNG 资源选择最小、完整且纯净的导出边界。 |
| 5 | `figma-arkui-plan` | 规划组件、文件、状态、字符串资源、属性绑定与实现顺序。 |
| 6 | `figma-asset-download` | 通过 Figma REST API 导出并验证三倍 PNG。 |
| 7 | `hmos-arkui-develop-skill` | 查询当前 API 证据并实现 ArkUI 组件。 |
| 8 | `figma-arkui-assemble` | 将组件组装为最终页面。 |
| 9 | `figma-arkui-review` | 对语义、交互、布局、资源和视觉一致性执行阻断式审查。 |

完整页面实现会依次执行全部阶段。仅分析节点、选择组件或审查已有实现时，只加载必要阶段及其上游依赖。

## 核心原则

- 将 Figma 作为产品语义、结构、交互、布局和资源的证据，不按图层机械复刻。
- 页签、列表、输入、选择和弹层优先使用原生 ArkUI 组件或工程已有组件。
- 保留设计能够证明的最低必要交互，不推断缺少证据的产品行为。
- 先证明布局关系，再选择 ArkUI 布局属性，并在 320、375 和 480 vp 下验证。
- 优先复用工程组件、Code Connect 映射和精确 IconFont；无法匹配时才使用 PNG 回退。
- 设计静态文案写入所属模块的 `string.json`，并通过 `$r('app.string.<name>')` 引用。
- 图片只从已确认的最小边界以三倍比例导出，避免把布局容器一并栅格化。
- 质量门禁未通过时不声明完成，并将问题返回负责该决策的阶段。

## Skill 结构

该仓库采用一个根 Skill 编排多个子技能的渐进式加载结构：

```text
figma-to-arkui/
├── SKILL.md                         # 根入口与完整工作流
├── INDEX.md                         # 子技能路由索引
├── references/                      # 跨阶段质量门禁与追踪契约
├── examples/                        # 回归验证案例
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

运行时只需发现根目录的 `SKILL.md`。根 Skill 根据 `INDEX.md` 选择当前任务需要的子技能；每个子技能再按需读取自己的参考契约并运行确定性脚本，从而避免一次加载全部上下文。

## 环境要求

- 支持目录式 Skill 和渐进式加载的智能体运行时；
- 已认证且对目标节点有访问权的 Figma 插件连接；
- 环境变量 `FIGMA_TOKEN`；
- `hmos-arkui-develop-skill`；
- Node.js；
- 可用于实现、编译和视觉验证的 HarmonyOS 工程。

## 验证

在仓库根目录运行全部确定性测试：

```bash
node --test \
  skills/figma-evidence-routing/scripts/route_node_digests.test.mjs \
  skills/figma-export-boundary-selection/scripts/resolve_export_boundaries.test.mjs \
  skills/figma-asset-download/scripts/download_figma_png.test.mjs \
  skills/figma-arkui-review/scripts/audit_arkui_semantics.test.mjs \
  skills/figma-arkui-review/scripts/validate_layout_constraints.test.mjs
```

确定性审计、ArkUI 验证、响应式检查、视觉比对和共享质量门禁全部通过后，工作流才会报告完成。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。
