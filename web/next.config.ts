import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 显式告诉 Turbopack 当前是项目根,
  // 避免它误用上一级 leave-the-moon/package-lock.json
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
