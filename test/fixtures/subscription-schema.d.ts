export {}

declare global {
  interface DirectusSchema {
    realtime_posts: Array<{
      id: number
      slug: string
      title: string
    }>
  }
}
