# Authentication

nuxt-directus-sdk uses Directus's **session-based authentication**, which is ideal for Nuxt applications. Session mode provides better security (httpOnly cookies) and works seamlessly across domains with proper configuration.

## Quick Start

### Basic Login

```typescript
const { login, logout, user, loggedIn } = useDirectusAuth()

// Login with email/password
await login('user@example.com', 'password')

// Check if logged in
if (loggedIn.value) {
  console.log('User:', user.value)
}

// Logout
await logout()
```

The module automatically:
- Sets the session cookie
- Fetches the user data
- Redirects after login/logout
- Handles token refresh

## SSO / OAuth Login

One-line integration with SSO providers:

```typescript
const { loginWithProvider } = useDirectusAuth()

// Redirect to Google OAuth
await loginWithProvider('google')

// Other providers
await loginWithProvider('github')
await loginWithProvider('microsoft')
await loginWithProvider('facebook')
```

The flow:
1. Redirects to Directus SSO endpoint
2. User authenticates with provider
3. Directus sets session cookie
4. Redirects back to your app
5. User is automatically logged in

## User Management

### Get Current User

```typescript
const { user, readMe } = useDirectusAuth()

// User is auto-fetched on app load
console.log(user.value)

// Manually refresh user data
await readMe()
```

### Update Current User

```typescript
const { updateMe } = useDirectusAuth()

await updateMe({
  first_name: 'John',
  last_name: 'Doe',
})
```

### User Registration

```typescript
const { register } = useDirectusAuth()

const newUser = await register({
  email: 'newuser@example.com',
  password: 'secure-password',
  first_name: 'John',
  last_name: 'Doe',
})
```

### Password Reset

```typescript
const { passwordRequest, passwordReset } = useDirectusAuth()

// Request password reset
await passwordRequest('user@example.com', 'https://yourapp.com/reset-password')

// Reset password with token
await passwordReset('reset-token', 'new-password')
```

### User Invites

```typescript
const { inviteUser, acceptUserInvite } = useDirectusAuth()

// Invite a user
await inviteUser('newuser@example.com', 'role-id', 'https://yourapp.com/accept-invite')

// Accept invite
await acceptUserInvite('invite-token', 'password')
```

## Protected Routes

### Page-Level Protection

Protect individual pages with the `auth` middleware:

```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div>
    <p>This page requires authentication</p>
  </div>
</template>
```

### Global Protection

Protect all routes by default:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    auth: {
      enableGlobalAuthMiddleware: true,
    },
  },
})
```

Then allow public pages:

```vue
<script setup>
definePageMeta({
  middleware: [] // Override global middleware
})
</script>
```

### Custom Redirects

Configure where users are redirected:

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      redirect: {
        login: '/account/login',    // Where to go when not logged in
        home: '/dashboard',          // Where to go after login
        logout: '/',                 // Where to go after logout
      },
    },
  },
})
```

## Server-Side Authentication

### In Server Routes

```typescript
// server/api/profile.ts
export default defineEventHandler(async (event) => {
  const directus = useServerDirectus(event)

  // This request is automatically authenticated with the user's session
  const user = await directus.request(readMe())

  return { user }
})
```

### Admin Operations

```typescript
// server/api/admin/users.ts
export default defineEventHandler(async () => {
  const directus = useAdminDirectus()

  // Uses admin token for privileged operations
  const users = await directus.request(readUsers())

  return { users }
})
```

## Configuration

### Frontend Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    url: process.env.DIRECTUS_URL,

    auth: {
      enabled: true,                    // default
      autoRefresh: true,                // auto-refresh tokens
      credentials: 'include',           // required for cross-domain
      realtimeAuthMode: 'public',      // 'public', 'handshake', or 'strict'
      enableGlobalAuthMiddleware: false, // protect all routes
      readMeFields: ['*'],              // fields to fetch for current user
      redirect: {
        home: '/',
        login: '/account/login',
        logout: '/',
      },
    },
  },
})
```

### Backend Configuration

#### Same Domain Setup

If your Nuxt app and Directus are on the same domain (e.g., localhost in dev):

```env
# Directus .env
AUTH_LOCAL_MODE=session
SESSION_COOKIE_SECURE=false  # true in production
SESSION_COOKIE_SAME_SITE=Lax

CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

#### Cross-Domain Setup

For production with separate domains (e.g., `app.example.com` and `api.example.com`):

```env
# Directus .env
AUTH_LOCAL_MODE=session
SESSION_COOKIE_DOMAIN=.example.com    # Shared parent domain
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

CORS_ENABLED=true
CORS_ORIGIN=https://app.example.com
CORS_CREDENTIALS=true
```

## Composable API Reference

### `useDirectusAuth()`

Returns an object with auth methods and state:

```typescript
const {
  user,                  // Ref<DirectusUser | null>
  loggedIn,             // ComputedRef<boolean>
  readMe,               // () => Promise<DirectusUser>
  updateMe,             // (data) => Promise<DirectusUser>
  login,                // (email, password, options?) => Promise<DirectusUser>
  loginWithProvider,    // (provider, redirect?) => Promise<void>
  logout,               // (redirect?) => Promise<void>
  register,             // (data) => Promise<DirectusUser>
  createUser,           // (data) => Promise<DirectusUser>
  inviteUser,           // (email, role, inviteUrl?) => Promise<void>
  acceptUserInvite,     // (token, password) => Promise<void>
  passwordRequest,      // (email, resetUrl?) => Promise<void>
  passwordReset,        // (token, password) => Promise<void>
} = useDirectusAuth()
```

### `useDirectusUser()`

Direct access to the user state:

```typescript
const user = useDirectusUser()
// Ref<DirectusUser | null>
```

## Advanced Topics

### Custom Login Logic

```typescript
const { login } = useDirectusAuth()

// Login without redirect
await login('user@example.com', 'password', {
  redirect: false
})

// Login with custom redirect
await login('user@example.com', 'password', {
  redirect: '/custom-page'
})

// Login and handle manually
const user = await login('user@example.com', 'password', {
  redirect: false
})

if (user.role === 'admin') {
  await navigateTo('/admin')
} else {
  await navigateTo('/dashboard')
}
```

### Listen to Login Events

```typescript
// plugins/auth-listener.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('directus:loggedIn', (user) => {
    console.log('User logged in:', user)
    // Track login event, update analytics, etc.
  })
})
```

### Configurable User Fields

Control which fields are fetched for the current user:

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      readMeFields: ['id', 'email', 'first_name', 'last_name', 'avatar'],
    },
  },
})
```

## Troubleshooting

### Cookies Not Being Set

1. ✅ Check `CORS_CREDENTIALS=true` in Directus
2. ✅ Verify `SESSION_COOKIE_DOMAIN` is set correctly
3. ✅ Ensure both sites use HTTPS in production (required for `SameSite=None`)
4. ✅ Check `credentials: 'include'` is set in module config

### Session Not Persisting

1. ✅ Make sure cookies aren't being blocked by browser
2. ✅ Check browser dev tools → Application → Cookies
3. ✅ Verify `directus_session_token` cookie exists
4. ✅ Ensure cookie domain matches your setup

### SSR Issues

1. ✅ Use `useServerDirectus(event)` in server routes (not `useDirectus()`)
2. ✅ Check cookies are being forwarded on SSR (automatic with this module)
3. ✅ Verify server-side requests include session cookie

## See Also

- [Directus Authentication Docs](https://docs.directus.io/reference/authentication.html)
- [Server-Side Utils](/guide/server-side)
- [Configuration Reference](/api/configuration)
