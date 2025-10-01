# Session-Based Authentication Guide

This module uses Directus's **session-based authentication**, which is ideal for cross-domain setups (e.g., `app.example.com` ↔ `api.example.com`).

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
    url: process.env.DIRECTUS_URL, // e.g., 'https://api.example.com'

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
DIRECTUS_URL=https://api.example.com
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
SESSION_COOKIE_DOMAIN=.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=https://app.example.com
CORS_CREDENTIALS=true

# WebSocket/Realtime Configuration (if using realtime features)
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=handshake
WEBSOCKETS_REST_AUTH_TIMEOUT=30000

# Optional: Refresh Token Configuration (if not using session mode exclusively)
REFRESH_TOKEN_COOKIE_DOMAIN=.example.com
REFRESH_TOKEN_COOKIE_SECURE=true
REFRESH_TOKEN_COOKIE_SAME_SITE=None
```

### Configuration Explained

#### Authentication & Cookies
- **`SESSION_COOKIE_DOMAIN`**: Set to your root domain with a leading dot (e.g., `.example.com`) to allow cookies to work across subdomains
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
| app.example.com | api.example.com | .example.com |
| www.mysite.io | directus.mysite.io | .mysite.io |
| portal.acme.org | cms.acme.org | .acme.org |

### Multi-Environment Setup (Staging + Production)

#### Scenario 1: Single Directus, Multiple Frontends

If **one Directus instance** serves **multiple frontend domains** (e.g., `api.example.com` powers both `staging.example.com` and `app.example.com`, or even completely different domains like `staging.test-domain.com`), you need to:

**1. Don't set a shared cookie domain** - Each domain gets its own session:

```env
# Directus .env
# DO NOT set SESSION_COOKIE_DOMAIN - let it default to the API domain
# SESSION_COOKIE_DOMAIN=  # Leave unset or comment out

SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

# Allow multiple origins (comma-separated)
CORS_ORIGIN=https://staging.example.com,https://app.example.com,https://staging.test-domain.com
CORS_CREDENTIALS=true
```

**2. How it works:**
- When `staging.example.com` logs in → gets a session cookie for `api.example.com`
- When `app.example.com` logs in → gets a separate session cookie for `api.example.com`
- When `staging.test-domain.com` logs in → gets a separate session cookie for `api.example.com`
- Sessions are isolated per frontend domain
- Users must log in separately to each frontend

✅ **Benefits:**
- One Directus instance serves multiple apps (even across different domains)
- Sessions isolated per frontend
- Different users/data per environment
- Cost-effective (single backend)
- Perfect for multi-tenant or white-label applications

⚠️ **Important**: Each frontend has its own session. A user logged into staging won't be logged into production automatically.

**Visual Example:**
```
                    api.example.com (Single Directus)
                            |
                    +-------+-------+-------+
                    |               |       |
         staging.example.com  app.example.com  staging.test-domain.com
         (Staging)            (Production)      (Alt Staging)
                    |               |               |
            Session Cookie   Session Cookie   Session Cookie
            (isolated)       (isolated)       (isolated)
```

**Key Point:** By NOT setting `SESSION_COOKIE_DOMAIN`, cookies default to the API domain (`api.example.com`) but the browser tracks which frontend domain made the request, effectively isolating sessions. This works even across completely different domains!

#### Scenario 2: Multiple Environments with Shared Parent Domain

If you have multiple environments sharing the same parent domain, you have two options:

##### Option A: Shared Cookie Domain (Simpler, Less Isolated)

Use a shared cookie domain across all environments:

```env
# Both staging and production Directus
SESSION_COOKIE_DOMAIN=.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
```

**Environments:**
- Staging: `staging.example.com` → `staging-api.example.com`
- Production: `app.example.com` → `api.example.com`

⚠️ **Important Considerations:**
- Sessions are **shared across all subdomains** under `.example.com`
- If a user logs into staging, they'll also be logged into production (and vice versa)
- This can cause confusion but simplifies testing
- Best for: Teams that want to test production-like behavior in staging

##### Option B: Isolated Cookie Domains (Recommended, More Secure)

Use separate cookie domains for each environment:

**Staging Directus (.env):**
```env
SESSION_COOKIE_DOMAIN=staging-api.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
CORS_ORIGIN=https://staging.example.com
```

**Production Directus (.env):**
```env
SESSION_COOKIE_DOMAIN=api.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
CORS_ORIGIN=https://app.example.com
```

✅ **Benefits:**
- Staging and production sessions are **completely isolated**
- Users must log in separately to each environment
- More secure - production sessions can't leak to staging
- Best for: Production deployments where isolation is important

##### Option C: Completely Different Domains (Most Isolated)

Use entirely different domains for staging:

**Staging:**
- Frontend: `staging.example-test.com`
- Backend: `api.staging.example-test.com`
- Cookie Domain: `.staging.example-test.com`

**Production:**
- Frontend: `app.example.com`
- Backend: `api.example.com`
- Cookie Domain: `.example.com`

✅ **Maximum Isolation** - No chance of cookie conflicts

### SSO (Single Sign-On) Support

This module fully supports Directus SSO providers (Google, GitHub, Microsoft, etc.). The session-based authentication works seamlessly with OAuth flows:

**Example Usage:**

```typescript
// Redirect to Directus SSO login
const { loginWithProvider } = useDirectusAuth()

// User clicks "Login with Google"
await loginWithProvider('google')

// Flow:
// 1. Redirects to: https://api.example.com/auth/login/google?redirect=https://app.example.com/current-page
// 2. User authenticates with Google
// 3. Directus handles OAuth and creates session
// 4. Directus sets httpOnly session cookie
// 5. Redirects back to your app with cookie
// 6. Plugin auto-fetches user on load
// ✅ User is logged in!
```

**Available Providers** (if configured in Directus):
- Google
- GitHub
- Microsoft
- Facebook
- Twitter
- Discord
- Custom OIDC providers

**Configuration:**

Configure SSO providers in your Directus instance. See [Directus SSO Documentation](https://docs.directus.io/self-hosted/sso.html) for setup instructions.

The SDK automatically handles the OAuth redirect flow and session cookie management - no additional configuration needed!

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


## Local Development

Testing session-based authentication locally requires special configuration:

### Option 1: Use Same Domain (Recommended for Local Dev)

Run both your Nuxt app and Directus on `localhost` with different ports:

**Nuxt:** `http://localhost:3000`
**Directus:** `http://localhost:8055`

**Directus `.env`:**
```env
# Local development - no cookie domain needed
# SESSION_COOKIE_DOMAIN=  # Leave unset

SESSION_COOKIE_SECURE=false  # Can be false for local HTTP
SESSION_COOKIE_SAME_SITE=Lax  # Lax works for same domain

# Allow localhost CORS
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

**Nuxt `.env`:**
```env
DIRECTUS_URL=http://localhost:8055
```

✅ **This works because both are on `localhost` - the browser treats them as same-site**

### Option 4: Local Nuxt + Production/Staging Directus (Common Dev Workflow)

Use your live/staging Directus instance with local Nuxt development. This is ideal when your Directus content doesn't change frequently:

**Nuxt `.env` (local):**
```env
DIRECTUS_URL=https://api.example.com  # Your live/staging Directus
```

**Directus `.env` (production/staging):**
```env
SESSION_COOKIE_DOMAIN=.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

# IMPORTANT: Add localhost to CORS origins
CORS_ORIGIN=https://app.example.com,http://localhost:3000
CORS_CREDENTIALS=true
```

✅ **Benefits:**
- Develop against real data
- No need to run Directus locally
- Test with actual production content
- One less service to run locally

⚠️ **Important Considerations:**
- **Security**: Only add `localhost` to CORS in staging/development Directus instances, NOT production
- **Data Safety**: Be careful not to modify production data during development
- **Network**: Requires internet connection to work

**Best Practice for Production:**
Create a separate staging Directus instance for local development:
```env
# Local development against staging
DIRECTUS_URL=https://staging-api.example.com

# Staging Directus allows localhost
CORS_ORIGIN=https://staging.example.com,http://localhost:3000
```

This way you never risk affecting production data!

### Option 2: Use Proxying (Alternative)

Proxy Directus through your Nuxt dev server to avoid CORS:

**`nuxt.config.ts`:**
```typescript
export default defineNuxtConfig({
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8055',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  },

  directus: {
    url: '/api'  // Use relative URL
  }
})
```

### Option 3: Use ngrok/Tunneling (For Testing Production-like Setup)

Use ngrok to create HTTPS tunnels for local testing:

```bash
# Terminal 1 - Directus tunnel
ngrok http 8055
# Gets: https://abc123.ngrok.io

# Terminal 2 - Nuxt tunnel
ngrok http 3000
# Gets: https://def456.ngrok.io
```

**Directus `.env`:**
```env
SESSION_COOKIE_DOMAIN=.ngrok.io
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
CORS_ORIGIN=https://def456.ngrok.io
CORS_CREDENTIALS=true
```

**Nuxt `.env`:**
```env
DIRECTUS_URL=https://abc123.ngrok.io
```

### Troubleshooting Local Development

**Cookies not working locally:**
1. ✅ Use `localhost` for both (not `127.0.0.1`)
2. ✅ Set `SESSION_COOKIE_SECURE=false` for HTTP
3. ✅ Set `SESSION_COOKIE_SAME_SITE=Lax` (not `None` for local)
4. ✅ Don't set `SESSION_COOKIE_DOMAIN` for localhost

**Mixed content errors:**
- If using HTTPS for one and HTTP for the other, browsers will block it
- Use tunneling (ngrok) or use HTTP for both

**Port conflicts:**
- Make sure Directus and Nuxt use different ports
- Common setup: Nuxt on `:3000`, Directus on `:8055`

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
