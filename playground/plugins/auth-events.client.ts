import { defineNuxtPlugin, useDirectusAuth, useState } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  // TODO: (eslint) revisit any types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastEvent = useState<{ user: any, firedAt: string } | null>('directus.lastLoginEvent', () => null)

  // Register listener for future hook calls (e.g. explicit login during the session)
  nuxtApp.hook('directus:loggedIn', (user) => {
    lastEvent.value = { user, firedAt: new Date().toISOString() }
  })

  // The hook fires inside directus-plugin's setup(), which runs before app plugins.
  // By the time this plugin registers the listener above, the hook has already fired.
  // Populate from current auth state as a fallback for the session-restore case.
  const { user, loggedIn } = useDirectusAuth()
  if (loggedIn.value && user.value && !lastEvent.value) {
    lastEvent.value = { user: user.value, firedAt: new Date().toISOString() }
  }
})
