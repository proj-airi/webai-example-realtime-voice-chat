import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    unocss: true,
    vue: true,
    ignores: [
      '**/assets/js/**',
      '**/assets/live2d/models/**',
    ],
    rules: {
      'antfu/import-dedupe': 'error',
      'import/order': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type-builtin',
            'type-import',
            'value-builtin',
            'value-external',
            'type-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            'value-internal',
            ['value-parent', 'value-sibling', 'value-index'],
            ['wildcard-value-parent', 'wildcard-value-sibling', 'wildcard-value-index'],
            'side-effect',
            'style',
          ],
          newlinesBetween: 'always',
        },
      ],
      'style/padding-line-between-statements': 'error',
    },
  },
)
