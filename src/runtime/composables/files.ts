import type { Query } from '@directus/sdk'
import { uploadFiles } from '@directus/sdk'
import { useDirectus, useDirectusUrl } from './directus'

import type { AllCollections, DirectusFiles } from '#build/types/directus'

export type DirectusThumbnailFormat = 'jpg' | 'png' | 'webp' | 'tiff'
export type DirectusThumbnailFit = 'cover' | 'contain' | 'inside' | 'outside'

export interface DirectusThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  fit?: DirectusThumbnailFit
  format?: DirectusThumbnailFormat
  withoutEnlargement?: boolean
  token?: string
}

interface FileUpload {
  file: File
  data?: Record<keyof DirectusFiles, string>
}

export async function uploadDirectusFile(files: FileUpload[], query: Query<AllCollections, AllCollections['directus_files']>) {
  const directus = useDirectus()
  const formData = new FormData()

  files.forEach(({ file, data }, i) => {
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.set(`file_${i + 1}_${key}`, value)
      })
    }

    formData.set('file', file)
  })

  return await directus.request(uploadFiles(formData, query as any)) as unknown as DirectusFiles[]
}

// NOTE: Any reason to update these?
export function getDirectusAssetUrl(fileId: string, options?: { token?: string }): string {
  const directusUrl = useDirectusUrl()
  const url = new URL(`${directusUrl}assets/${fileId}`)

  if (options?.token)
    url.searchParams.append('access_token', options.token)

  return url.href
}

export function getDirectusThumbnailUrl(fileId: string, options?: DirectusThumbnailOptions): string {
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
