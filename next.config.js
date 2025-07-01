/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  // Ensure CSS is handled properly
  transpilePackages: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
}

module.exports = nextConfig
