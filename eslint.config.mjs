import nextConfig from 'eslint-config-next/core-web-vitals';
import nextTypeScriptConfig from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextConfig,
  ...nextTypeScriptConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
