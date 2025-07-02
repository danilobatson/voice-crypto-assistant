/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		esmExternals: true,
		// Ensure runtime allows streaming
		serverComponentsExternalPackages: [],
	},
	// Optimizations for AWS Amplify
	trailingSlash: false,
	// Remove env property - API keys should only be server-side accessible
	// Next.js automatically loads environment variables for server-side code
	// Disable TypeScript and ESLint checking during build for faster deploys
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	webpack: (config) => {
		// Add path aliases for webpack
		config.resolve.alias = {
			...config.resolve.alias,
			'@': path.resolve(process.cwd(), 'src'),
		};
		return config;
	},
	async headers() {
		return [
			{
				source: '/api/:path*',
				headers: [
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET, POST, PUT, DELETE, OPTIONS',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value: 'Content-Type, Authorization',
					},
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
				],
			},
		];
	},
};

export default nextConfig;
