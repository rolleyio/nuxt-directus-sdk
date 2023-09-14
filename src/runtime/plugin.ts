import { fromUrl, parseDomain } from 'parse-domain'
import auth from './middleware/auth'
import { useDomain, useSubdomain } from './composables/domain'
import { useDirectusAuth } from './composables/auth'
import { addRouteMiddleware, defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(async (nuxt) => {
  const domain = useDomain()
  const subdomain = useSubdomain()

  // TODO: This isnt a great way to get the domain and subdomain
  // Must be a better way to do this
  if (nuxt.ssrContext) {
    const { host } = nuxt.ssrContext.event.node.req.headers

    if (host) {
      const { labels, domain: mainDomain, topLevelDomains } = parseDomain(
        fromUrl(host),
      ) as any

      if (mainDomain)
        domain.value = `${mainDomain}.${topLevelDomains.join('.')}`
      else if (host.includes('127.0.0.1') || host.includes('0.0.0.0'))
        domain.value = host.split(':')?.[0] ?? ''
      else if (host.includes('localhost'))
        domain.value = host.split('.')?.at(-1) ?? ''
      else
        domain.value = host

      subdomain.value = labels?.[0] ?? ''
    }
  }

  const config = useRuntimeConfig()

  if (config.public.directus.fetchUser)
    await useDirectusAuth().fetchUser()

  addRouteMiddleware('auth', auth)
})
