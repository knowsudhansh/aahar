import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@aahar/api-client', '@aahar/types', '@aahar/ui']
};

export default nextConfig;
