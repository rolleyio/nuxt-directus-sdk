// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  // type: 'lib', // TODO: This enforces strict return types on all functions.
  ignores: ['dist/**', 'node_modules/**'],
})
