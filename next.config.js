/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	typescript: {
		// Skip TypeScript type checking during build for deployment
		ignoreBuildErrors: true,
	},
	eslint: {
		// Skip ESLint during build for deployment
		ignoreDuringBuilds: true,
	},
	experimental: {
		esmExternals: true,
	},
	env: {
		CUSTOM_KEY: process.env.CUSTOM_KEY,
	},
	webpack: (config) => {
		// Add path aliases for webpack
		config.resolve.alias = {
			...config.resolve.alias,
			'@': path.resolve(__dirname, 'src'),
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
				],
			},
		];
	},
};

module.exports = nextConfig;
