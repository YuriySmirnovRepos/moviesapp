import path from 'path';
import { fileURLToPath } from 'url';

import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import { FlatCompat } from '@eslint/eslintrc';
import airbnb from 'eslint-config-airbnb';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import babelParser from '@babel/eslint-parser';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const compat = new FlatCompat({
  baseDirectory: dirname,
});

export default [
  ...compat.extends(...airbnb.extends),
  eslintPluginPrettier,
  {
    rules: {
      // правила форматирования из конфига каты
      // indent: ['error', 2],
      'prettier/prettier': [
        'error',
        { singleQuote: true, endOfLine: 'auto', tabWidth: 2 },
      ],
      'linebreak-style': [0, 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      // semi: ['error', 'never'], <-- этот параметр от каты не по airbnb!
      'prettier/end-of-line': [0, 'auto'],
      'import/no-unresolved': [2, { caseSensitive: false }],
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    },
  },
  {
    files: ['src/**/*.js'],
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      '.vscode/**',
      '.husky/*',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          exclude: ['node_modules/**'],
          presets: ['@babel/preset-react', '@babel/preset-env'],
        },
      },
    },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      'import/no-named-as-default': 0,
      'import/no-named-as-default-member': 0,
    },
  },
  ...compat.plugins('import', 'react-hooks'),
  ...compat.config({
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      // из конфига каты
      'import/order': [
        2,
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],
    },
    settings: {
      // из конфига каты
      'import/no-unresolved': [2, { caseSensitive: false }],
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'src'],
        },
      },
    },
  }),
];
