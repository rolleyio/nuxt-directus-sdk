import type { DirectusFile as SdkDirectusFile } from '@directus/sdk'

export {}

// Fields anchored to the SDK type so renames/removals error at compile time.
// folder is included as DirectusFolder<object> | string | null — the union covers both
// expanded queries and the bare UUID string used when passing folder as FormData metadata.
type SdkFileStringFields = Partial<Pick<SdkDirectusFile<object>,
  | 'title'
  | 'description'
  | 'location'
  | 'type'
  | 'charset'
  | 'storage'
  | 'filename_disk'
  | 'filename_download'
  | 'folder'
>>

declare global {
  interface DirectusFile extends SdkFileStringFields {
    id: string
  }
  interface DirectusUser {
    id: string
  }
  interface DirectusSchema {
    directus_files: DirectusFile
    directus_users: DirectusUser
  }
}
