# ── Stage 1: Build ────────────────────────────────────────────────────────────
# 使用官方 Bun 镜像安装依赖并构建
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# 先复制 lockfile，利用 Docker 层缓存加速重复构建
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 复制全部源码
COPY . .

# 构建 Nuxt / Nitro 产物（输出到 .output/）
RUN bun run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
# 运行阶段只需 Node.js，不需要 Bun 或 node_modules
# Nitro 会将所有依赖打包进 .output/server/，最终镜像极小
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 只复制 Nitro 构建产物（自包含，无需额外 node_modules）
COPY --from=builder /app/.output /app/.output

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/config || exit 1

CMD ["node", ".output/server/index.mjs"]
