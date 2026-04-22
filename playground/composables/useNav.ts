interface NavLink { label: string, to: string, description?: string }
interface NavGroup { label: string, links: NavLink[] }

export const useNav = (): NavGroup[] => [
  {
    label: 'Overview',
    links: [
      { label: 'Home', to: '/' },
    ],
  },
  {
    label: 'Auth',
    links: [
      { label: 'Login', to: '/auth/login', description: '<code>login()</code>, <code>loginWithProvider()</code>, redirect options, <code>directus:loggedIn</code> hook' },
      { label: 'Register', to: '/auth/register', description: '<code>register()</code>' },
      { label: 'Password Reset', to: '/auth/password', description: '<code>passwordRequest()</code>, <code>passwordReset()</code>' },
      { label: 'Profile (protected)', to: '/auth/profile', description: '<code>readMe()</code>, <code>updateMe()</code>, <code>useDirectusUser()</code>' },
      { label: 'Dashboard (protected)', to: '/dashboard', description: '<code>auth</code> middleware' },
      { label: 'Middleware', to: '/auth/middleware', description: '<code>guest</code> middleware, <code>enableGlobalAuthMiddleware</code>, <code>directus:loggedIn</code> hook' },
    ],
  },
  {
    label: 'Composables',
    links: [
      { label: 'Server Side', to: '/server', description: '<code>useAdminDirectus()</code>, <code>useSessionDirectus()</code>, <code>useTokenDirectus()</code>' },
      { label: 'Client Side', to: '/utils', description: '<code>useDirectusUrl()</code>, <code>useDirectusOriginUrl()</code>, <code>useDirectusPreview()</code>, <code>useDirectusVisualEditor()</code>' },
    ],
  },
  {
    label: 'Data',
    links: [
      { label: 'Auto-Imports', to: '/data/auto-import', description: '<code>readSingleton()</code> vs. <code>useAsyncData()</code>' },
      { label: 'Blog (readItems)', to: '/blog', description: '<code>useDirectus()</code> + <code>readItems()</code> with filter &amp; sort' },
    ],
  },
  {
    label: 'Visual Editor',
    links: [
      { label: 'Visual Editor Demo', to: '/visual-editor', description: '<code>DirectusVisualEditor</code>, <code>useDirectusVisualEditor()</code>, setup instructions' },
    ],
  },
  {
    label: 'File Management',
    links: [
      { label: 'Upload & URL', to: '/files', description: '<code>uploadDirectusFile()</code>, <code>uploadDirectusFiles()</code>, <code>getDirectusFileUrl()</code>' },
    ],
  },
]
