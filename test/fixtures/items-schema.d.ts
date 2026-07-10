export {}

declare global {
  interface DirectusSchema {
    test_posts: Array<{
      id: number
      status: 'draft' | 'published'
      title: string
    }>
    test_settings: {
      site_name: string
    }
  }
}
