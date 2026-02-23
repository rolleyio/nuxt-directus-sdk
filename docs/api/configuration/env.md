---
outline: deep
---

# Environment Variables

### .env.development

```dotenv
# Required
DIRECTUS_URL=http://localhost:8055

# Optional (for type generation and admin operations)
DIRECTUS_ADMIN_TOKEN=your-admin-token-here
```

### .env.production

For production, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add DIRECTUS_URL production
vercel env add DIRECTUS_ADMIN_TOKEN production
```

**Netlify:**
```bash
# In Netlify UI: Site settings → Environment variables
DIRECTUS_URL=https://your-directus.com
DIRECTUS_ADMIN_TOKEN=your-token
```

**Docker:**
```dockerfile
ENV DIRECTUS_URL=https://your-directus.com
ENV DIRECTUS_ADMIN_TOKEN=your-token
```

::: tip Docker with split URLs
When using Docker Compose, you can use the object URL form in `nuxt.config.ts` to route SSR requests through the internal Docker network:
```typescript
directus: {
  url: {
    client: 'https://cms.example.com',
    server: 'http://directus:8055', // Docker service name
  },
}
```
:::