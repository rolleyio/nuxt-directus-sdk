import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // Main Nuxt module entry
    { input: 'src/module.ts' },
    // Standalone rules entry point
    { input: 'src/rules/index.ts' },
  ],
  declaration: true,
  rollup: {
    emitCJS: false,
  },
  externals: [
    '@directus/sdk',
    '@directus/types',
    // Nuxt/Vue externals
    'nuxt',
    'nuxt/app',
    '@nuxt/kit',
    'vue',
    // Node externals
    'fs/promises',
    // Optional peer deps for validation
    'arktype',
    'zod',
    'valibot',
  ],
})
