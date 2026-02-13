import { defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'
import { apply } from '@directus/visual-editing'
import { useDirectusOriginUrl, useDirectusVisualEditor } from '../composables/directus'

export default defineNuxtPlugin({
  name: 'directus-visual-editor',
  dependsOn: ['directus-plugin'],
  setup(nuxtApp) {
    const directusVisualEditor = useDirectusVisualEditor()
    const route = useRoute()
    const config = useRuntimeConfig()

    const debug = route.query.debug !== undefined
    const log = (...args: any[]) => {
      if (debug)
        console.warn('[Directus Visual Editor]', ...args)
    }

    log('Config visualEditor:', config.public.directus.visualEditor)
    log('Is in iframe:', directusVisualEditor.value)

    if (!directusVisualEditor.value) {
      log('Not in iframe — visual editor disabled')
      return
    }

    const directusUrl = useDirectusOriginUrl()
    log('Directus URL:', directusUrl)

    let applied = false

    async function applyVisualEditing() {
      if (applied) {
        log('Already applied, skipping')
        return
      }

      const elements = document.querySelectorAll('[data-directus]')
      log('Found', elements.length, '[data-directus] elements')

      if (elements.length === 0) {
        return
      }

      try {
        log('Calling apply()...')
        const result = await apply({
          directusUrl,
          onSaved: (_data) => {
            log('onSaved triggered, refreshing data')
            refreshNuxtData()
          },
        })

        log('apply() result:', !!result)

        if (result) {
          applied = true
          result.enable()
        }
      }
      catch (error) {
        console.error('[Directus Visual Editor] Error:', error)
        log('This may be a CSP issue — check Content-Security-Policy headers allow frame-ancestors and postMessage to', directusUrl)
      }
    }

    // Use MutationObserver to detect when data-directus attributes appear in the DOM
    // This handles the SSR hydration timing issue where reactive updates haven't flushed yet
    const observer = new MutationObserver(() => {
      const elements = document.querySelectorAll('[data-directus]')
      if (elements.length > 0) {
        log('MutationObserver: found', elements.length, '[data-directus] elements')
        observer.disconnect()
        applyVisualEditing()
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-directus'],
      subtree: true,
      childList: true,
    })

    log('MutationObserver started, waiting for [data-directus] elements')

    // Also handle client-side navigation (new page components)
    nuxtApp.hook('page:finish', () => {
      log('page:finish — re-scanning for editable elements')
      applied = false
      applyVisualEditing()
    })

    return {
      provide: {
        directusVisualEditing: {
          refresh: applyVisualEditing,
        },
      },
    }
  },
})
