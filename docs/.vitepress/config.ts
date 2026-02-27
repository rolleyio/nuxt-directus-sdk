import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Nuxt Directus SDK',
  description:
    'The best way to integrate Directus with Nuxt - featuring authentication, realtime, file management, and more',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/configuration' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Authentication', link: '/guide/authentication' },
          { text: 'Realtime & WebSockets', link: '/guide/realtime' },
          { text: 'File Management', link: '/guide/files' },
          { text: 'Visual Editor', link: '/guide/visual-editor' },
          { text: 'Server-Side Utils', link: '/guide/server-side' },
        ],
      },
      {
        text: 'Rules DSL',
        items: [
          { text: 'Defining Rules', link: '/guide/rules' },
          { text: 'Testing Rules', link: '/guide/rules-testing' },
          { text: 'Sync & CLI', link: '/guide/rules-sync' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          {
            text: 'Configuration',
            link: 'index',
            collapsed: true,
            base: '/api/configuration/',
            items: [
              { text: 'Module Options', link: 'module' },
              { text: 'Environment Variables', link: 'env' },
              { text: 'Directus Server Configuration', link: 'server' },
            ],
          },
          {
            text: 'Composables',
            link: 'index',
            collapsed: true,
            base: '/api/composables/',
            items: [
              { text: 'Authentication', link: 'auth' },
              { text: 'Client', link: 'client' },
              { text: 'File', link: 'file' },
              { text: 'Storage', link: 'storage' },
            ],
          },
          {
            text: 'Components',
            link: 'index',
            collapsed: true,
            base: '/api/components/',
            items: [
              { text: 'Visual Editor', link: 'visual-editor' },
              { text: 'Edit Button', link: 'edit-button' },
              { text: 'Add Button', link: 'add-button' },
            ],
          },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/rolleyio/nuxt-directus-sdk' }],
    editLink: {
      pattern: 'https://github.com/rolleyio/nuxt-directus-sdk/edit/next/docs/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      formatOptions: {
        dateStyle: 'medium',
      },
    },
    externalLinkIcon: true,
  },
})
