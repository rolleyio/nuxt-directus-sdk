import type { Query } from '@directus/sdk'
import { uploadFiles } from '@directus/sdk'
import type { AllDirectusCollections, DirectusFiles } from 'nuxt/app'
import { useDirectus, useDirectusUrl } from './directus'

import { useDirectusTokens } from './tokens'

export type DirectusThumbnailFormat = 'jpg' | 'png' | 'webp' | 'tiff'
export type DirectusThumbnailFit = 'cover' | 'contain' | 'inside' | 'outside'

export interface DirectusThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  fit?: DirectusThumbnailFit
  format?: DirectusThumbnailFormat
  withoutEnlargement?: boolean
  token?: string | boolean
}

interface FileUpload {
  file: File
  data?: Record<keyof DirectusFiles, string>
}

export async function uploadDirectusFile(file: FileUpload, query?: Query<AllDirectusCollections, AllDirectusCollections['directus_files']>) {
  const result = await uploadDirectusFiles([file], query)

  return (Array.isArray(result) ? result[0] : result)
}

export async function uploadDirectusFiles(files: FileUpload[], query?: Query<AllDirectusCollections, AllDirectusCollections['directus_files']>) {
  const directus = useDirectus()
  const formData = new FormData()

  files.forEach(({ file, data }) => {
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.set(key, value)
      })
    }

    formData.set('file', file)
  })

  return await directus.request(uploadFiles(formData, query as any)) as unknown as DirectusFiles[] | DirectusFiles
}

export function getDirectusAssetUrl(fileId: string, options?: { token?: string | boolean }): string {
  const url = new URL(`${useDirectusUrl()}assets/${fileId}`)

  if (options?.token) {
    if (typeof options.token === 'string') {
      url.searchParams.append('access_token', options.token)
    }
    else if (typeof options.token === 'boolean') {
      const token = useDirectusTokens().accessToken.value

      if (token)
        url.searchParams.append('access_token', token)
    }
  }

  return url.href
}

export function getDirectusThumbnailUrl(fileId: string, options?: DirectusThumbnailOptions): string {
  const url = new URL(`${useDirectusUrl()}assets/${fileId}`)

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
    if (options?.token) {
      if (typeof options.token === 'string')
        url.searchParams.append('access_token', options.token)
      else
        url.searchParams.append('access_token', useDirectusTokens().accessToken.value ?? '')
    }
  }

  return url.href
}
