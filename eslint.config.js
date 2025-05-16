import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'no-console': 0,
      'import/no-self-import': 0,
      'array-callback-return': 0,
      'no-case-declarations': 0,
      'vue/no-mutating-props': 0,
    },
  },
)
