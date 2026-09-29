import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 本机常用 127.0.0.1 访问 dev 服务；不放行会被当作跨域拦掉 HMR，
  // 导致客户端组件更新不生效（重启才恢复）。
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
