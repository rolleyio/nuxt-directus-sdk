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

export interface DirectusNotificationObject {
  id?: number
  timestamp?: string
  status?: 'inbox' | 'archived'
  recipient: Array<string> | string
  sender?: Array<string> | string
  subject: string
  message?: string
  collection?: string
  item?: string
}

export interface DirectusQueryParams {
  fields?: Array<string>
  sort?: string | Array<string>
  filter?: Record<string, unknown>
  limit?: number
  offset?: number
  page?: number
  alias?: string | Array<string>
  deep?: Record<string, unknown>
  search?: string
  meta?: 'total_count' | 'filter_count' | '*'
}

