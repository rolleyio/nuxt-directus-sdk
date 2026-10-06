import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import SponsoredBy from './components/SponsoredBy.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SponsoredBy', SponsoredBy)
  },
} satisfies Theme
