module.exports = {
    root: true,
    env: {
      browser: true,
      es2021: true,
      'react-native/react-native': true,
      node: true
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/jsx-runtime'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: [
      'react',
      'react-hooks',
      '@typescript-eslint',
      'react-native'
    ],
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/jsx-uses-react': 'error',  // Add this line
      'react/react-in-jsx-scope': 'off'  // Add this line
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  };