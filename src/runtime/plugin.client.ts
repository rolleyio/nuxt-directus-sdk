import type { PluginOptions } from 'vue-toastification'
import Toast, { POSITION } from 'vue-toastification'

import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxt) => {
  const options: PluginOptions = {
    position: POSITION.BOTTOM_RIGHT,
  }

  nuxt.vueApp.use(Toast, options)
})
