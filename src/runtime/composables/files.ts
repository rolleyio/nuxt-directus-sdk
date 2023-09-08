import { uploadFiles } from '@directus/sdk'
import type { DirectusThumbnailOptions } from '../types'
import { useDirectus, useDirectusUrl } from './directus'

// TODO: might be options to pass here?
export async function uploadDirectusFile(file: File, folder?: string) {
  const directus = useDirectus()
  const formData = new FormData()

  formData.set('file', file)

  if (folder)
    formData.set('folder', folder)

  return directus.request(uploadFiles(formData))
}

// NOTE: Any reason to update these?
export function getDirectusAssetUrl(fileId: string, options?: { token?: string }): string {
  const directusUrl = useDirectusUrl()
  const url = new URL(`${directusUrl}assets/${fileId}`)

  if (options?.token)
    url.searchParams.append('access_token', options.token)

  return url.href
}

export function getDirectusThumbnailUrl(
  fileId: string,
  options?: DirectusThumbnailOptions,
): string {
  const directusUrl = useDirectusUrl()
  const url = new URL(`${directusUrl}assets/${fileId}`)

  if (options) {
    if (options.width)
      url.searchParams.append('width', options.width.toFixed(0))
    if (options.height)
      url.searchParams.append('height', options.height.toFixed(0))
    if (options.quality)
      url.searchParams.append('quality', options.quality.toFixed(0))
    if (options.withoutEnlargement)
      url.searchParams.append('withoutEnlargement', 'true')
    if (options.fit)
      url.searchParams.append('fit', options.fit)
    if (options.format)
      url.searchParams.append('format', options.format)
    if (options.token)
      url.searchParams.append('access_token', options.token)
  }

  return url.href
}
