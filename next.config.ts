import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nivo/core', '@nivo/sankey'],
};

export default nextConfig;
