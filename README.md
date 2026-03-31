<div align="center">

# 🤖 NuxtChat

**基于 Vue3 + Nuxt4 完整复刻的 NextChat**

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

NuxtChat 是对 [NextChat（ChatGPT Next Web）](https://github.com/ChatGPTNextWeb/NextChat) 的完整 Vue3 技术栈复刻，功能完全对齐，并在存储、状态管理、样式方案上进行了 Vue 生态本地化适配。

- **存储层**：IndexedDB（`idb-keyval`）本地优先，数据不经任何服务器
- **状态管理**：Pinia（10 个 Store，对话/配置/模型选择/主题等全量托管）
- **样式**：Tailwind CSS v4 + CSS 自定义属性（零 UI 框架依赖）
- **图标**：完整沿用 NextChat 的 69 个原版 SVG 图标
- **API 安全**：Nuxt Server Routes 服务端代理，API Key 永不暴露给浏览器

---

## 功能特性

### 核心聊天
- ✅ 多会话管理（创建、删除、搜索、重命名）
- ✅ 流式响应（SSE 逐 token 渲染）
- ✅ 消息操作（复制、重新生成、删除单条）
- ✅ 图片上传（粘贴 / 拖拽 / 文件选择，支持多模态模型）
- ✅ 自动生成对话标题
- ✅ 发送快捷键可选（Enter / Shift+Enter）

### 多模型支持（14+ 提供商）

| 国际提供商 | 国内提供商 |
|-----------|-----------|
| OpenAI / Azure OpenAI | 百度文心一言 |
| Anthropic Claude | 阿里通义千问 |
| Google Gemini | 智谱 ChatGLM |
| xAI Grok | 字节豆包 |
| Stability AI | 讯飞星火 |
| 302.AI | DeepSeek / Moonshot |
| SiliconFlow | — |

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

### 界面 & 体验
- ✅ 深色 / 浅色 / 跟随系统三种主题（Pinia 持久化）
- ✅ 响应式设计（桌面 + 移动端自适应）
- ✅ 中文 / English 双语（`@nuxtjs/i18n`）
- ✅ 字体大小自定义
- ✅ SSR（服务端渲染）

---

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
npm run preview
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
| 状态管理 | Pinia + @pinia/nuxt | `^3.0` |
| 样式 | Tailwind CSS v4 | `^4.2` |
| 本地存储 | idb-keyval（IndexedDB） | `^6.2` |
| Markdown | marked + highlight.js | `^17 / ^11` |
| 安全渲染 | DOMPurify | `^3.3` |
| 国际化 | @nuxtjs/i18n | `^10.2` |
| 工具函数 | @vueuse/nuxt | `^14.2` |
| SVG 图标 | vite-svg-loader | `^5.1` |
| 数学公式 | marked-katex-extension | `^5.1` |
| 流程图 | mermaid | `^11.13` |

### 目录结构

```
kfm_nuxtchat_v2/
├── nuxt.config.ts              # 框架配置
├── app/
│   ├── app.vue                 # 根组件
│   ├── assets/
│   │   ├── css/main.css        # Tailwind v4 入口 + CSS 变量主题
│   │   └── icons/              # 69 个 NextChat 原版 SVG 图标
│   ├── layouts/
│   │   └── default.vue         # 主布局（侧边栏 + 内容区）
│   ├── pages/
│   │   ├── index.vue           # 主聊天页
│   │   ├── plugin.vue          # 插件管理
│   │   ├── mcp.vue             # MCP 工具市场
│   │   └── sd.vue              # Stable Diffusion
│   ├── components/
│   │   ├── AppSidebar.vue      # 侧边栏
│   │   ├── ui/                 # 基础组件（Button/Modal/Input/Icon/Toast）
│   │   ├── chat/               # 聊天组件（View/Input/Message/ModelSelector）
│   │   ├── markdown/           # Markdown 渲染器
│   │   ├── settings/           # 设置面板（5 Tab）
│   │   ├── mask/               # Mask 模板库
│   │   ├── artifacts/          # Artifacts 沙盒预览
│   │   ├── exporter/           # 对话导出
│   │   └── realtime/           # 实时语音对话
│   ├── stores/                 # Pinia Store（10 个）
│   │   ├── chat.ts             # 会话 & 消息
│   │   ├── config.ts           # 模型配置 & UI 设置
│   │   ├── access.ts           # API Key & 鉴权
│   │   ├── mask.ts             # 提示词模板
│   │   ├── plugin.ts           # 插件管理
│   │   ├── prompt.ts           # 提示词库
│   │   ├── sync.ts             # 数据同步
│   │   ├── mcp.ts              # MCP 服务器
│   │   └── sd.ts               # Stable Diffusion
│   ├── composables/
│   │   └── useChat.ts          # 流式对话核心逻辑
│   ├── utils/
│   │   ├── types.ts            # TypeScript 类型定义
│   │   ├── db.ts               # IndexedDB 封装
│   │   ├── models.ts           # 模型列表（40+ 模型）
│   │   └── common.ts           # 工具函数
│   └── locales/                # i18n（中文 / English）
├── server/
│   ├── utils/auth.ts           # 统一鉴权工具
│   └── api/                    # Nitro 服务端路由
│       ├── openai/[...path].ts # OpenAI 代理
│       ├── anthropic/          # Anthropic 代理
│       ├── google/             # Google 代理
│       ├── config.ts           # 公开配置接口
│       └── webdav/             # WebDAV 同步接口
└── i18n/locales/               # @nuxtjs/i18n 语言包
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

### 自托管（Node.js）

```bash
# 安装依赖 & 构建
npm install
npm run build

# 启动生产服务器
node .output/server/index.mjs
```

---

## 与 NextChat 的对应关系

| NextChat 技术 | NuxtChat 对应技术 |
|--------------|-----------------|
| Next.js 14 App Router | Nuxt 4 + Vue 3 |
| Zustand + persist | Pinia + idb-keyval |
| CSS Modules + CSS 变量 | Tailwind CSS v4 + CSS 变量 |
| @svgr/webpack | vite-svg-loader |
| next/navigation | useRouter（Vue Router） |
| API Routes（serverless） | Nuxt Server Routes（Nitro） |
| React Server Components | Nuxt SSR |
| localStorage（降级） | IndexedDB（首选） |

---

## 参考项目

- [NextChat](https://github.com/ChatGPTNextWeb/NextChat) — 原始项目，MIT License
- [Nuxt](https://nuxt.com) — Vue 全栈框架
- [Tailwind CSS v4](https://tailwindcss.com) — 原子化 CSS
- [Pinia](https://pinia.vuejs.org) — Vue 状态管理

---

## License

MIT © 2026 NuxtChat
