export {}

declare global {
  interface DirectusFile {
    id: string
  }
  interface DirectusUser {
    id: string
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DirectusSchema {
  }
}
