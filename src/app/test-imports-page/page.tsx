'use client';

import React from 'react';
import TestImports from '../../../test-imports';

export default function TestImportsPage() {
  return (
    <div>
      <h1>Test Imports Page</h1>
      <p>Testing if path aliases work within Next.js build system</p>
      <TestImports />
    </div>
  );
}
