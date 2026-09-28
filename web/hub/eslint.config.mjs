import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/** Next.js 官方规则 + TS 规则（扁平配置，Next 16 形态）。 */
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '.data/**',
      'next-env.d.ts',
    ],
  },
];

export default config;
