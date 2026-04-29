import type { DirectusFile as SdkDirectusFile } from '@directus/sdk'

export {}

// String-scalar fields that are safe to include: their types agree between the
// SDK definition and what the typegen produces. Several SDK fields are excluded
// because the typegen emits a different type for them:
//   filesize  — SDK: string | null  vs typegen: number | null
//   embed     — SDK: unknown | null vs typegen: string | null
//   metadata  — SDK: Record<…>|null vs typegen: 'json' | null
//   *_on      — SDK: "datetime" (required) vs typegen: 'datetime' (optional)
// The field names are explicit so that Pick errors at compile time if the SDK
// ever renames one; the types themselves still come from the SDK, not from here.
// See: https://github.com/rolleyio/nuxt-directus-sdk/pull/78#issuecomment-4346891162
type SdkFileStringFields = Partial<Pick<SdkDirectusFile<object>,
  | 'title'
  | 'description'
  | 'location'
  | 'type'
  | 'charset'
  | 'storage'
  | 'filename_disk'
  | 'filename_download'
>>

declare global {
  interface DirectusFile extends SdkFileStringFields {
    id: string
  }
  interface DirectusUser {
    id: string
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DirectusSchema {
  }
}
