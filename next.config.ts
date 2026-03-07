import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nivo/core", "@nivo/sankey"],
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
