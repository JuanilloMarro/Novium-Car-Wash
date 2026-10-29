import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // shadcn-vue components are kept exactly as the CLI generates them
  files: ['app/components/ui/**/*.vue'],
  rules: { 'vue/require-default-prop': 'off' },
})
