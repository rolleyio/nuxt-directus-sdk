import type { Query } from '@directus/sdk'
import { uploadFiles } from '@directus/sdk'
import type { AllDirectusCollections, DirectusFiles } from 'nuxt/app'
import { useDirectus, useDirectusUrl } from './directus'

import { useDirectusTokens } from './tokens'

interface DirectusFileUpload {
  file: File
  data?: Record<keyof DirectusFiles, string>
}

export async function uploadDirectusFile(file: DirectusFileUpload, query?: Query<AllDirectusCollections, AllDirectusCollections['directus_files']>) {
  const result = await uploadDirectusFiles([file], query)

  return (Array.isArray(result) ? result[0] : result)
}

export async function uploadDirectusFiles(files: DirectusFileUpload[], query?: Query<AllDirectusCollections, AllDirectusCollections['directus_files']>) {
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

export function getDirectusFileUrl(fileId: string, options?: { token?: string | boolean }): string {
  const url = new URL(`${useDirectusUrl('assets/')}${fileId}`)

  if (options?.token) {
    if (typeof options.token === 'string') {
      url.searchParams.append('access_token', options.token)
    }
    else if (options.token === true) {
      const token = useDirectusTokens().accessToken.value

      if (token)
        url.searchParams.append('access_token', token)
    }
  }

  return url.href
}
