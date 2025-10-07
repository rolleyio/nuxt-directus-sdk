import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Nuxt Directus SDK',
  description: 'The best way to integrate Directus with Nuxt - featuring authentication, realtime, file management, and more',
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
        text: 'API Reference',
        items: [
          { text: 'Configuration', link: '/api/configuration' },
          { text: 'Composables', link: '/api/composables' },
          { text: 'Components', link: '/api/components' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/directus-community/nuxt-directus-sdk' },
    ],
  },
})
