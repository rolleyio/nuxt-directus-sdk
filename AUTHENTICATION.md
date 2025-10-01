# Session-Based Authentication Guide

This module uses Directus's **session-based authentication**, which is ideal for cross-domain setups (e.g., `app.qudos.co.uk` ↔ `api.qudos.co.uk`).

## Why Session Authentication?

Session mode provides the best experience for Nuxt applications:

- ✅ Automatically handles authentication via `httpOnly` cookies
- ✅ Works seamlessly across different domains with proper configuration
- ✅ More secure (tokens aren't exposed to client-side JavaScript)
- ✅ No manual token management required
- ✅ Simpler implementation with fewer edge cases

## Frontend Configuration

### Basic Setup

In your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: {
    url: process.env.DIRECTUS_URL, // e.g., 'https://api.qudos.co.uk'

    auth: {
      autoRefresh: true, // Default - automatically refreshes tokens
      credentials: 'include', // Default - required for cross-domain
      realtimeAuthMode: 'handshake', // Default - 'public', 'handshake', or 'strict'
    }
  }
})
```

### Environment Variables

Create a `.env` file:

```env
DIRECTUS_URL=https://api.qudos.co.uk
DIRECTUS_ADMIN_TOKEN=your_admin_token_here
```

## Backend (Directus) Configuration

For cross-domain authentication to work, you **must** configure your Directus instance properly.

### Required Environment Variables

Add these to your Directus `.env` file:

```env
# Session Authentication Mode
AUTH_PROVIDERS=local
AUTH_LOCAL_MODE=session

# Session Cookie Configuration for Cross-Domain
SESSION_COOKIE_DOMAIN=.qudos.co.uk
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=https://app.qudos.co.uk
CORS_CREDENTIALS=true

# WebSocket/Realtime Configuration (if using realtime features)
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=handshake
WEBSOCKETS_REST_AUTH_TIMEOUT=30000

# Optional: Refresh Token Configuration (if not using session mode exclusively)
REFRESH_TOKEN_COOKIE_DOMAIN=.qudos.co.uk
REFRESH_TOKEN_COOKIE_SECURE=true
REFRESH_TOKEN_COOKIE_SAME_SITE=None
```

### Configuration Explained

#### Authentication & Cookies
- **`SESSION_COOKIE_DOMAIN`**: Set to your root domain with a leading dot (e.g., `.qudos.co.uk`) to allow cookies to work across subdomains
- **`SESSION_COOKIE_SECURE`**: Must be `true` for production (requires HTTPS)
- **`SESSION_COOKIE_SAME_SITE`**: Set to `None` for cross-domain cookies (requires `SECURE=true`)

#### CORS
- **`CORS_ORIGIN`**: Your frontend domain (can be comma-separated list for multiple domains)
- **`CORS_CREDENTIALS`**: Must be `true` to allow cookies in cross-origin requests

#### WebSockets/Realtime
- **`WEBSOCKETS_ENABLED`**: Set to `true` to enable WebSocket functionality
- **`WEBSOCKETS_REST_AUTH`**: Authentication mode for WebSockets on the backend (`public`, `handshake`, or `strict`)
  - `handshake` (recommended): Authentication happens during WebSocket connection handshake using session cookie
  - `public`: No authentication required (not recommended for production)
  - `strict`: Requires authentication on every message (more overhead)
- **`WEBSOCKETS_REST_AUTH_TIMEOUT`**: Time in milliseconds to complete authentication (default: 30000)

**Note**: The SDK automatically uses `authMode: 'handshake'` which works seamlessly with session cookies. The session token is sent automatically during the WebSocket connection handshake.

### Domain Examples

| Frontend | Backend | SESSION_COOKIE_DOMAIN |
|----------|---------|----------------------|
| app.qudos.co.uk | api.qudos.co.uk | .qudos.co.uk |
| example.com | api.example.com | .example.com |
| app.mysite.io | directus.mysite.io | .mysite.io |

## Usage

### Login

```typescript
const { login } = useDirectusAuth()

await login('user@example.com', 'password')
// Session cookie is automatically set by Directus
```

### Get Current User

```typescript
const { user, loggedIn } = useDirectusAuth()

// On app initialization, the plugin automatically fetches the user
// if a valid session cookie exists

if (loggedIn.value) {
  console.log('User:', user.value)
}
```

### Logout

```typescript
const { logout } = useDirectusAuth()

await logout()
// Session cookie is automatically cleared
```

### Make Authenticated Requests

```typescript
const directus = useDirectus()

// Session cookie is automatically included
const items = await directus.request(readItems('your_collection'))
```

### Using Realtime/WebSockets

The realtime functionality works seamlessly with session authentication:

```typescript
const directus = useDirectus()

// Connect to WebSocket (credentials automatically included)
await directus.connect()

// Subscribe to collection updates
const { subscription } = await directus.subscribe('your_collection', {
  query: {
    fields: ['*'],
  },
})

// Listen for updates
for await (const message of subscription) {
  console.log('Received update:', message)
}

// Unsubscribe when done
subscription.unsubscribe()
```

**Note**: Make sure `WEBSOCKETS_ENABLED=true` is set in your Directus backend configuration.

### Server-Side Usage

In Nuxt server routes, the session token is automatically extracted from cookies:

```typescript
// server/api/items.ts
export default defineEventHandler(async (event) => {
  const directus = useUserDirectus(event)

  // Request is authenticated with the user's session token
  const items = await directus.request(readItems('your_collection'))

  return items
})
```


## Troubleshooting

### Cookies not being set

1. ✅ Verify `SESSION_COOKIE_DOMAIN` is set correctly on Directus
2. ✅ Ensure `CORS_CREDENTIALS=true` on Directus
3. ✅ Check that both frontend and backend use HTTPS (required for `SameSite=None`)
4. ✅ Verify `credentials: 'include'` is set in module config

### Authentication fails after login

1. ✅ Check browser developer tools → Network → Check if cookies are being sent
2. ✅ Verify the `directus_session_token` cookie is present
3. ✅ Check Directus logs for authentication errors
4. ✅ Ensure CORS headers are correct (`Access-Control-Allow-Credentials: true`)

### CORS errors

1. ✅ Set `CORS_ORIGIN` to your exact frontend URL
2. ✅ Include `CORS_CREDENTIALS=true`
3. ✅ Ensure your Directus version supports session mode (v10.8+)

### WebSocket/Realtime not working

1. ✅ Verify `WEBSOCKETS_ENABLED=true` in Directus
2. ✅ Check that `WEBSOCKETS_REST_AUTH=handshake` is set
3. ✅ Ensure WebSocket connection can be established (check browser console for errors)
4. ✅ Verify that the session cookie is being sent with WebSocket handshake
5. ✅ Check Directus logs for WebSocket authentication errors
6. ✅ For cross-domain, ensure WebSocket URLs support wss:// (secure WebSockets)

## Additional Resources

- [Directus Authentication Docs](https://docs.directus.io/reference/authentication.html)
- [Directus SDK Authentication](https://docs.directus.io/guides/sdk/authentication.html)
- [Session Tokens & Cookies](https://directus.io/docs/guides/auth/tokens-cookies)

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Set `SESSION_COOKIE_SECURE=true`
3. ✅ Use `SameSite=None` only when necessary for cross-domain
4. ✅ Keep your Directus instance updated
5. ✅ Use environment variables for sensitive configuration
6. ✅ Implement rate limiting on login endpoints
