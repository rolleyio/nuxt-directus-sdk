---
outline: deep
---

# Directus Server Configuration

### Required Directus Settings

For the module to work correctly, configure your Directus instance:

```dotenv
# Directus .env

# Authentication
AUTH_LOCAL_MODE=session

# Session cookies
SESSION_COOKIE_SECURE=true  # false in development
SESSION_COOKIE_SAME_SITE=Lax  # None for cross-domain
SESSION_COOKIE_DOMAIN=.yourdomain.com  # For cross-domain

# CORS (required)
CORS_ENABLED=true
CORS_ORIGIN=https://your-nuxt-app.com
CORS_CREDENTIALS=true

# Realtime/WebSocket (optional)
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=strict
```

### Same Domain Setup

If Nuxt and Directus are on the same domain:

```dotenv
# Directus .env
SESSION_COOKIE_SECURE=false  # true in production
SESSION_COOKIE_SAME_SITE=Lax
CORS_ORIGIN=http://localhost:3000
```

### Cross-Domain Setup

If on different domains (e.g., app.example.com and api.example.com):

```dotenv
# Directus .env
SESSION_COOKIE_DOMAIN=.example.com  # Shared parent domain
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None  # Required for cross-domain
CORS_ORIGIN=https://app.example.com
```