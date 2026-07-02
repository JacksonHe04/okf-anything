#!/usr/bin/env bash
# dev_setup.sh — Kill anything on port 3000, then start moon-app dev on 3000.
#
# Usage (from moon-app/):
#   ./dev_setup.sh
#
# 设计意图：
#   - 旧 dev server 经常占着 3000 不放，新启动会被 Next.js 推到 3001 / 3002，
#     调试时浏览器和 curl 都对不上号。这个脚本强制让 moon-app dev 始终跑在 3000。
#   - pnpm --filter 自动沿目录树向上找到 workspace root，跨包名 moon-app 启动。

set -euo pipefail

PORT=3000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── 杀掉占用 $PORT 的进程 ─────────────────────────────────
PIDS="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  echo "[dev_setup] Killing process(es) on port $PORT: $PIDS"
  # 用 kill -9 兜底；不抛错（可能进程已经自己退出了）
  kill -9 $PIDS 2>/dev/null || true
  sleep 1
fi

# 兜底再检查一次
if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
  echo "[dev_setup] Port $PORT is still occupied after kill. Aborting." >&2
  lsof -i tcp:"$PORT" >&2 || true
  exit 1
fi

# ─── 启 moon-app dev，强制 3000 ─────────────────────────────
echo "[dev_setup] Starting moon-app dev on port $PORT..."
exec env PORT="$PORT" pnpm --filter moon-app dev