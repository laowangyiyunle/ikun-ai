# Agent Note: Web 客户端的 Kun 视觉语言

Status: implemented

[English](2026-08-17-kun-web-visual-language.md) | 中文

## Problem

Web 客户端目前使用中性的通用调色板，空会话首页只有鱼形标记；目标视觉则使用用户提供的黄色吉祥物、天蓝背景、暖色面板、橙色强调和厚重墨线。视觉方向需要保持 Agent 工作台的可读性，且不能改变会话、settings 或主题偏好行为。

## Decision

Web 客户端在空会话首页使用用户提供的 `apps/web/public/ikun-mascot.png`，地址为 `/ikun-mascot.png`，作为视觉锚点。`ui-sidebar` 复用同一资源渲染展开态的 `ikun`／`HARNESS` 字标和折叠态侧栏标记。图片保留在 Web 应用的静态资源中，不复制到包 bundle。

`packages/client/ui-theme/src/styles/design-platform.css` 为浅色和深色调色板拥有共享的 `--dsh-kun-*` 呈现 token。语义别名使用天蓝表面、奶油色高层面板、明黄主操作、橙色强调、钴蓝信息状态和近黑色墨线。首页编辑器、设置外壳和插件卡片消费这些 token，并加入有限的描边和偏移阴影细节。已有的 `light`／`dark`／`system` 偏好仍是唯一主题选择，不增加 settings 或 session wire 字段。

`packages/client/ui-theme/src/styles/base.css` 拥有圆润的本地字体栈：正文使用带系统中文回退的 `Trebuchet MS`，首页标题和侧栏品牌的展示字体栈优先使用 `Comic Sans MS`／`Segoe Print`。代码区域继续使用现有等宽字体栈。

## Alternatives considered

**保持中性的通用调色板。** 否决，因为它无法在首页和设置视图中表达所要求的吉祥物主导视觉方向。

**生成或打包替代吉祥物。** 否决，因为用户明确提供了要直接使用的图片；生成替代品或引入第三方素材会偏离参考并增加没有必要的资源变体。

**增加一个可由用户选择的 Kun 主题。** 否决，因为请求改变的是 Web 的出厂呈现，而不是持久化主题偏好约定。新增偏好会扩大 settings 持久化和测试范围，却不会改变视觉要求。

## Consequences

空会话首页和侧栏品牌现在依赖 Web 应用提供 `/ikun-mascot.png`；包 README 记录了这一归属。主题别名和 CSS 模块仍是呈现权威，因此插件继续获得相同的 slot 和 settings 行为。共享调色板会影响所有读取已修改别名的客户端组件，但活跃会话布局和面向模型的行为保持不变。
