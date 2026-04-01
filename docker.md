# Docker 部署指南

## 目录

- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [使用 docker-compose（推荐）](#使用-docker-compose推荐)
- [手动 docker 命令](#手动-docker-命令)
- [连接本地 Ollama](#连接本地-ollama)
- [Nginx 反向代理](#nginx-反向代理)
- [常用命令](#常用命令)
- [镜像说明](#镜像说明)

---

## 快速开始

### 前提条件

- Docker ≥ 24.0
- Docker Compose ≥ 2.20（插件版，命令为 `docker compose`）

### 三步启动

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd kfm_nuxtchat_v2

# 2. 配置环境变量
cp .env.example .env       # 按需填写 API Key
# 或直接编辑 docker-compose.yml 中的 environment 字段

# 3. 构建并启动
docker compose up -d --build
```

浏览器访问 **http://localhost:13000**

---

## 环境变量

在项目根目录创建 `.env` 文件（会被 `docker-compose.yml` 自动读取）：

```env
# ── 访问控制 ──────────────────────────────────────────────
# 多个密码用英文逗号分隔，留空则不需要密码
CODE=your-password

# ── 端口（默认 13000）───────────────────────────────────────
PORT=13000

# ── OpenAI ────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com   # 可改为中转地址

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
ENABLE_MCP=false
```

> **安全说明**：所有 `_API_KEY` 变量仅在容器内的服务端（Nitro）可见，浏览器无法读取。

---

## 使用 docker-compose（推荐）

```bash
# 后台启动（首次会自动构建镜像）
docker compose up -d --build

# 查看日志
docker compose logs -f nuxtchat

# 停止
docker compose down

# 停止并删除数据卷
docker compose down -v

# 仅重新构建镜像（不重启）
docker compose build

# 重建并重启
docker compose up -d --build --force-recreate
```

---

## 手动 docker 命令

```bash
# 构建镜像
docker build -t nuxtchat .

# 运行（最简）
docker run -d -p 13000:3000 --name nuxtchat nuxtchat

# 运行（带环境变量）
docker run -d \
  -p 13000:3000 \
  --name nuxtchat \
  --restart unless-stopped \
  -e OPENAI_API_KEY=sk-... \
  -e CODE=your-password \
  nuxtchat

# 查看日志
docker logs -f nuxtchat

# 进入容器调试
docker exec -it nuxtchat sh

# 停止并删除
docker stop nuxtchat && docker rm nuxtchat
```

---

## 连接本地 Ollama

容器内无法直接访问宿主机的 `localhost`，需要使用特殊地址：

**macOS / Windows（Docker Desktop）：**

```bash
# 宿主机地址自动解析为 host.docker.internal
docker run -d -p 13000:3000 \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  nuxtchat
```

**Linux：**

```bash
# 使用 --network=host 或获取宿主机 IP
docker run -d -p 13000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  nuxtchat
```

启动 Ollama 时需允许跨域：

```bash
OLLAMA_ORIGINS=* ollama serve
```

在 NuxtChat 设置 → API 密钥 → Ollama 地址处填写 `http://host.docker.internal:11434`。

---

## Nginx 反向代理

```nginx
server {
    listen 80;
    server_name chat.example.com;

    # 重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name chat.example.com;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # SSE 流式响应必须关闭缓冲
        proxy_buffering    off;
        proxy_cache        off;
        proxy_read_timeout 600s;
    }
}
```

---

## 常用命令

| 操作 | 命令 |
|------|------|
| 启动 | `docker compose up -d --build` |
| 停止 | `docker compose down` |
| 查看日志 | `docker compose logs -f nuxtchat` |
| 重启 | `docker compose restart nuxtchat` |
| 健康检查 | `docker inspect --format='{{.State.Health.Status}}' nuxtchat` |
| 清理旧镜像 | `docker image prune -f` |

---

## 镜像说明

采用**多阶段构建**，最终镜像极小：

| 阶段 | 基础镜像 | 用途 |
|------|---------|------|
| `builder` | `oven/bun:1.3-alpine` | 安装依赖、执行 `bun run build` |
| `runner` | `node:22-alpine` | 仅运行 `.output/server/index.mjs` |

Nitro 构建产物（`.output/`）是**自包含**的，所有运行时依赖均已打包，`runner` 阶段不需要 `node_modules`，最终镜像通常 **< 200 MB**。
