import js from '@eslint/js';
import globals from 'globals';
export default [js.configs.recommended, {
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
  rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
}, { files:['tests/**/*.js'], languageOptions:{globals:{card:'readonly',hass:'readonly',calls:'readonly',escaped:'readonly',edited:'readonly'}} }];
