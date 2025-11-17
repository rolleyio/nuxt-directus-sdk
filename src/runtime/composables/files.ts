import type { Query } from '@directus/sdk'
import { uploadFiles } from '@directus/sdk'
import { useDirectus, useDirectusUrl } from './directus'
import type { DirectusFile, DirectusSchema } from '#build/types/directus'

interface DirectusFileUpload {
  file: File
  data?: Record<keyof DirectusFile, string>
}

export async function uploadDirectusFile(file: DirectusFileUpload, query?: Query<DirectusSchema, DirectusSchema['directus_files']>) {
  const result = await uploadDirectusFiles([file], query)

  return (Array.isArray(result) ? result[0] : result)
}

export async function uploadDirectusFiles(files: DirectusFileUpload[], query?: Query<DirectusSchema, DirectusSchema['directus_files']>) {
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

  return directus.request(uploadFiles(formData, query as any)) as unknown as DirectusFile[] | DirectusFile
}

export type DirectusThumbnailFormat = 'jpg' | 'png' | 'webp' | 'tiff' | 'avif'
export type DirectusThumbnailFit = 'cover' | 'contain' | 'inside' | 'outside'

export interface DirectusFileOptions {
  filename?: string
  download?: boolean
  width?: number
  height?: number
  quality?: number
  fit?: DirectusThumbnailFit
  format?: DirectusThumbnailFormat
  withoutEnlargement?: boolean
  key?: string
}

export function getDirectusFileUrl(file: string | DirectusFile, options?: DirectusFileOptions): string {
  const fileId = typeof file === 'string' ? file : file.id
  const url = new URL(useDirectusUrl(`assets/${fileId}${options?.filename ? `/${options.filename}` : ''}`))

  if (options?.download) {
    url.searchParams.append('download', 'true')
  }

  if (options?.width) {
    url.searchParams.append('width', options.width.toFixed(0))
  }

  if (options?.height) {
    url.searchParams.append('height', options.height.toFixed(0))
  }

  if (options?.quality) {
    url.searchParams.append('quality', options.quality.toFixed(0))
  }

  if (options?.withoutEnlargement) {
    url.searchParams.append('withoutEnlargement', 'true')
  }

  if (options?.fit) {
    url.searchParams.append('fit', options.fit)
  }

  if (options?.format) {
    url.searchParams.append('format', options.format)
  }

  if (options?.key) {
    url.searchParams.append('key', options.key)
  }

  // Note: In session mode with cookies, assets work if:
  // 1. Using the dev proxy (same-origin, cookies sent automatically)
  // 2. Production with same domain (cookies sent automatically)
  // 3. Cross-origin with proper CORS + credentials setup
  // If assets fail with 403, ensure your Directus CORS settings allow credentials
  // or use the dev proxy during development

  return url.href
}
