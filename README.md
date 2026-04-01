<div align="center">

# 🤖 NuxtChat

**基于 Vue 3 + Nuxt 4 完整复刻的 NextChat**

一个轻量、快速、隐私优先的多模型 AI 聊天客户端

[![Nuxt](https://img.shields.io/badge/Nuxt-4.4-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Pinia](https://img.shields.io/badge/Pinia-3.0-FFD859?logo=pinia)](https://pinia.vuejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[功能特性](#功能特性) · [快速开始](#快速开始) · [环境变量](#环境变量) · [技术架构](#技术架构) · [部署](#部署)

</div>

---

## 项目简介

NuxtChat 是对 [NextChat（ChatGPT Next Web）](https://github.com/ChatGPTNextWeb/NextChat) 的完整 Vue 3 技术栈复刻，功能完全对齐，并在存储、状态管理、样式方案上进行了 Vue 生态本地化适配。

- **渲染模式**：纯客户端渲染（`ssr: false`），避免 IndexedDB 水合不匹配，首屏数据即时可用
- **存储层**：IndexedDB（`idb-keyval`）+ 串行写队列，本地优先，数据不经任何服务器
- **状态管理**：Pinia（10 个 Store，对话 / 配置 / 模型 / 主题等全量托管）
- **样式**：Tailwind CSS v4（CSS-first 配置）+ CSS 自定义属性，零 UI 框架依赖
- **图标**：统一使用 [Lucide](https://lucide.dev)（`lucide-vue-next`），通过 `AppIcon` 封装并支持别名向后兼容
- **API 安全**：Nuxt Server Routes（Nitro）服务端代理，API Key 永不暴露给浏览器

---

## 功能特性

### 核心聊天
- ✅ 多会话管理（创建、删除、搜索、重命名）
- ✅ 流式响应（SSE 逐 token 渲染）
- ✅ 消息操作（复制、重新生成、删除单条）
- ✅ 图片上传（粘贴 / 拖拽 / 文件选择，支持多模态模型）
- ✅ 自动生成对话标题
- ✅ 发送快捷键可选（Enter / Shift+Enter）

### 多模型支持（15+ 提供商）

| 国际提供商 | 国内提供商 | 本地部署 |
|-----------|-----------|---------|
| OpenAI / Azure OpenAI | DeepSeek | **Ollama**（动态拉取模型列表） |
| Anthropic Claude | Moonshot（Kimi） | — |
| Google Gemini | 阿里通义千问 | — |
| xAI Grok | 智谱 ChatGLM | — |
| Stability AI | 字节豆包 | — |
| 302.AI | SiliconFlow | — |

**DeepSeek 双优先级代理**：优先走官方 API，5xx / 网络故障时自动降级到用户配置的自定义中转地址，4xx（Key 无效 / 余额不足）直接报错不重试。

**Ollama 本地模型**：启动 `OLLAMA_ORIGINS=* ollama serve` 后，在模型选择器中实时拉取已安装模型列表，无需 API Key。

### 提示词 & Mask 系统
- ✅ 内置 5 个角色模板（AI 助手、代码专家、写作助手、翻译专家、学术助手）
- ✅ 自定义创建 / 编辑 Mask（名称、头像、系统提示词）
- ✅ 新建对话时选择 Mask 快速启动

### 插件系统
- ✅ 基于 **OpenAPI 3.0** 规范动态加载插件
- ✅ 内置网络搜索插件
- ✅ 自定义 JSON 插件导入

### MCP（Model Context Protocol）
- ✅ MCP 服务器管理（SSE / stdio 协议）
- ✅ 工具市场 UI
- ✅ 可用工具列表展示

### Artifacts（内容预览）
- ✅ AI 生成 HTML / 代码的沙盒 iframe 预览
- ✅ 防 XSS 隔离
- ✅ 支持全屏 / 下载

### Stable Diffusion
- ✅ Stability AI API 集成
- ✅ 完整参数配置（模型、步数、尺寸、负向提示词）
- ✅ 生成历史画廊

### 实时语音对话
- ✅ 基于浏览器 Web Speech API
- ✅ 支持中英文语音识别
- ✅ TTS 语音播报 AI 回复

### 数据管理
- ✅ **WebDAV 同步**（坚果云、Nextcloud 等）
- ✅ 导出对话为 **Markdown / JSON / 纯文本**
- ✅ 全量 IndexedDB 数据备份与恢复

### 对话操作
- ✅ **分享对话**：一键复制全部对话内容到剪贴板（格式化文本）
- ✅ **导出对话**：下载为 Markdown / JSON / 纯文本三种格式

### 界面 & 体验
- ✅ 深色 / 浅色 / 跟随系统三种主题（持久化到 IndexedDB）
- ✅ **移动端完整适配**：抽屉式侧边栏、顶部导航栏、Safe Area 刘海屏适配、触摸友好按钮
- ✅ 响应式布局（桌面 / 平板 / 手机）
- ✅ 中文 / English 双语（`@nuxtjs/i18n`）
- ✅ 字体大小自定义（作用于 `<html>` 根元素，Tailwind `rem` 单位全局缩放）
- ✅ 纯客户端渲染（`ssr: false`），无水合不匹配问题

---

## 快速开始

### 环境要求

- [Bun](https://bun.sh) ≥ 1.3（推荐，安装速度比 npm 快 10x）
- Node.js ≥ 18（运行时兼容）

```bash
# 安装 Bun（如未安装）
curl -fsSL https://bun.sh/install | bash
```

### 安装依赖

```bash
bun install
```

### 本地开发

```bash
bun run dev
# 访问 http://localhost:3000
```

### 生产构建

```bash
bun run build
bun run preview
```

### 类型检查

```bash
bun run typecheck
```

---

## 环境变量

在项目根目录创建 `.env` 文件：

```env
# ── 访问控制 ──────────────────────────────────────────────
# 访问密码（多个密码用英文逗号分隔）
CODE=your-access-code,another-code

# 是否隐藏用户自填 API Key 的入口
# HIDE_USER_API_KEY=1

# ── OpenAI ────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com   # 可替换为中转地址

# ── Anthropic ─────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── Google Gemini ─────────────────────────────────────────
GOOGLE_API_KEY=AIza...

# ── Azure OpenAI ──────────────────────────────────────────
AZURE_API_KEY=...
AZURE_BASE_URL=https://YOUR_RESOURCE.openai.azure.com

# ── DeepSeek ──────────────────────────────────────────────
DEEPSEEK_API_KEY=sk-...

# ── 功能开关 ──────────────────────────────────────────────
# 启用 MCP 工具市场
ENABLE_MCP=true
```

> **安全说明**：所有 `*_API_KEY` 变量仅在服务端可见，浏览器端永远无法获取。

---

## 技术架构

### 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 + Nuxt 4 | `^4.4.2` |
| 语言 | TypeScript | 内置 |
| 渲染模式 | 纯客户端渲染（`ssr: false`） | — |
| 状态管理 | Pinia + @pinia/nuxt | `^3.0` |
| 样式 | Tailwind CSS v4（CSS-first） | `^4.2` |
| 本地存储 | idb-keyval（IndexedDB）+ 串行写队列 | `^6.2` |
| Markdown | marked + highlight.js | `^17 / ^11` |
| 安全渲染 | DOMPurify | `^3.3` |
| 国际化 | @nuxtjs/i18n | `^10.2` |
| 工具函数 | @vueuse/nuxt | `^14.2` |
| 图标库 | lucide-vue-next | `^1.0` |
| 数学公式 | marked-katex-extension | `^5.1` |
| 流程图 | mermaid | `^11.13` |
| 服务端路由 | Nitro（Nuxt 内置） | — |

### 目录结构

```
kfm_nuxtchat_v2/
├── nuxt.config.ts                  # 框架配置（ssr: false, viewport-fit=cover）
├── app/
│   ├── app.vue                     # 根组件
│   ├── assets/css/main.css         # Tailwind v4 入口 + CSS 变量主题 + safe-area
│   ├── layouts/
│   │   └── default.vue             # 主布局（桌面常驻 / 移动端抽屉式侧边栏）
│   ├── pages/
│   │   ├── index.vue           # 主聊天页
│   │   ├── plugin.vue          # 插件管理
│   │   ├── mcp.vue             # MCP 工具市场
│   │   └── sd.vue              # Stable Diffusion
│   ├── components/
│   │   ├── AppSidebar.vue          # 侧边栏（桌面/移动端复用）
│   │   ├── ui/                     # 基础组件（Modal / Icon / Toast …）
│   │   ├── chat/                   # 聊天组件（View / Input / Message / ModelSelector）
│   │   ├── markdown/               # Markdown 渲染器（含 KaTeX / Mermaid）
│   │   ├── settings/               # 设置面板（通用 / API Key / 主题 / 字体）
│   │   ├── mask/                   # 提示词 Mask 模板库
│   │   ├── artifacts/              # Artifacts 沙盒 iframe 预览
│   │   ├── exporter/               # 对话导出（MD / JSON / TXT）
│   │   └── realtime/               # 实时语音对话
│   ├── composables/
│   │   ├── useChat.ts              # 流式对话核心逻辑（多 Provider 路由）
│   │   └── useOllama.ts            # Ollama 动态模型拉取 & 连通性检测
│   ├── stores/                     # Pinia Store（10 个）
│   │   ├── chat.ts                 # 会话 & 消息
│   │   ├── config.ts               # 模型配置 & UI 设置（主题 / 字体大小）
│   │   ├── access.ts               # API Key & 鉴权（含 ollamaUrl）
│   │   ├── mask.ts / prompt.ts     # 提示词模板 & 提示词库
│   │   ├── plugin.ts / mcp.ts      # 插件 & MCP 服务器
│   │   ├── sync.ts                 # WebDAV 数据同步
│   │   └── sd.ts                   # Stable Diffusion
│   ├── plugins/
│   │   └── store-init.client.ts    # 客户端启动时从 IndexedDB 恢复全量状态
│   └── utils/
│       ├── types.ts                # TypeScript 类型定义
│       ├── db.ts                   # IndexedDB 封装 + 串行写队列
│       ├── models.ts               # 模型列表（40+ 模型，含 Ollama 动态模型）
│       └── common.ts               # 工具函数
├── server/
│   ├── utils/auth.ts               # 统一鉴权工具
│   └── api/
│       ├── openai/[...path].ts     # OpenAI 兼容通用代理
│       ├── deepseek/[...path].ts   # DeepSeek 专属代理（官方优先 + fallback）
│       ├── ollama/[...path].ts     # Ollama 本地代理（无需 API Key）
│       ├── anthropic/              # Anthropic 代理
│       ├── google/                 # Google 代理
│       ├── config.ts               # 公开配置接口
│       └── webdav/                 # WebDAV 同步接口
└── i18n/locales/                   # @nuxtjs/i18n 语言包（zh / en）
```

### 数据流

```
用户输入
  └─► Pinia chatStore（添加消息）
        └─► useChat composable（构建请求）
              └─► Nuxt Server Route（/api/openai/...）
                    └─► OpenAI / Claude / Gemini API（服务端代理）
                          └─► SSE 流式响应 → 逐 token 更新 chatStore
                                └─► Vue 响应式自动更新 UI
                                      └─► idb-keyval 持久化到 IndexedDB
```

---

## 部署

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（见上方表格）
4. 部署完成

### Docker

```bash
# 构建镜像
docker build -t nuxtchat .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  -e CODE=your-password \
  nuxtchat
```

### 自托管（Node.js / Bun）

```bash
# 安装依赖 & 构建
bun install
bun run build

# 用 Node 启动（推荐稳定环境）
node .output/server/index.mjs

# 或用 Bun 启动（更快）
bun .output/server/index.mjs
```

---

## 与 NextChat 的对应关系

| NextChat 技术 | NuxtChat 对应技术 |
|--------------|-----------------|
| Next.js 14 App Router | Nuxt 4 + Vue 3 |
| Zustand + persist | Pinia + idb-keyval |
| CSS Modules + CSS 变量 | Tailwind CSS v4 + CSS 变量 |
| @svgr/webpack | lucide-vue-next |
| next/navigation | useRouter（Vue Router） |
| API Routes（serverless） | Nuxt Server Routes（Nitro） |
| React Server Components | 纯客户端渲染（`ssr: false`，IndexedDB 无水合冲突） |
| localStorage（降级） | IndexedDB + 串行写队列（idb-keyval） |

---

## 参考项目

- [NextChat](https://github.com/ChatGPTNextWeb/NextChat) — 原始项目，MIT License
- [Nuxt](https://nuxt.com) — Vue 全栈框架
- [Tailwind CSS v4](https://tailwindcss.com) — 原子化 CSS
- [Pinia](https://pinia.vuejs.org) — Vue 状态管理

---

## License

MIT © 2026 NuxtChat
