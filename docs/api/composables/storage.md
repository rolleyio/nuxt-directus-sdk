---
outline: deep
---

# Storage Composables

### `useDirectusStorage()`

Get the Directus client storage instance (primarily for internal use).

**Returns:** `DirectusStorage`

```typescript
const storage = useDirectusStorage()

// Get item
const token = await storage.get('directus_session_token')

// Set item
await storage.set('directus_session_token', 'token-value')

// Delete item
await storage.delete('directus_session_token')
```

**Note:** This composable is mainly used internally for session management. You typically won't need to use it directly.