// Test file to verify path aliases work in Next.js
'use client';

import React from 'react';
import theme from '@/lib/theme';

export default function PathAliasTest() {
	return (
		<div>
			<h1>Path Alias Test</h1>
			<p>
				If this page loads without errors, path aliases are working correctly.
			</p>
			<p>Theme imported: {theme.palette.mode}</p>
		</div>
	);
}
