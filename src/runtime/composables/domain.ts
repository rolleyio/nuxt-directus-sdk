import type { Ref } from '#imports'
import { useState } from '#imports'

export function useDomain(): Ref<string> {
  return useState<string>('domain', () => '')
}

export function useSubdomain(): Ref<string> {
  return useState<string>('subdomain', () => '')
}

export function getSubdomainLink(slug: string): string {
  const domain = useDomain()

  return `//${slug}.${domain.value}/`
}
