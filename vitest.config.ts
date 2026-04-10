import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          include: ['test/url-helpers.server.test.ts'],
        },
        define: {
          'import.meta.server': true,
          'import.meta.client': false,
          'import.meta.dev': true,
        },
      },
      {
        test: {
          name: 'client',
          include: ['test/url-helpers.client.test.ts'],
        },
        define: {
          'import.meta.server': false,
          'import.meta.client': true,
          'import.meta.dev': true,
        },
      },
      {
        test: {
          name: 'default',
          include: ['test/**/*.test.ts'],
          exclude: ['test/url-helpers.server.test.ts', 'test/url-helpers.client.test.ts'],
        },
      },
    ],
  },
})
