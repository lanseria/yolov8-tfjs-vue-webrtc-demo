// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  formatters: {
    css: true, // by default use Prettier
    html: true, // by default use Prettier
    toml: 'dprint', // use dprint for TOML
    markdown: 'prettier', // use prettier for markdown
  },
  ignores: [
    'node_modules/',
    'public/',
    'dist/',
  ],
})
