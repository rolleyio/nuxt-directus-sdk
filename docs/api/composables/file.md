---
outline: deep
---

# File Composables

### `uploadDirectusFile(file, query?)`

Upload a single file to Directus.

**Parameters:**
- `file: { file: File, data?: Partial<DirectusFiles> }` - File and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles>`

```typescript
const file = event.target.files[0]

const uploaded = await uploadDirectusFile({
  file,
  data: {
    title: 'My Image',
    description: 'Image description',
    folder: 'folder-uuid',
  }
}, {
  fields: ['*'],
})

console.log('Uploaded:', uploaded.id)
```

---

### `uploadDirectusFiles(files, query?)`

Upload multiple files to Directus.

**Parameters:**
- `files: Array<{ file: File, data?: Partial<DirectusFiles> }>` - Files and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles[]>`

```typescript
const files = Array.from(event.target.files).map(file => ({
  file,
  data: {
    folder: 'folder-uuid',
  }
}))

const uploaded = await uploadDirectusFiles(files)

console.log('Uploaded files:', uploaded.length)
```

---

### `getDirectusFileUrl(file, options?)`

Generate a URL for a Directus file with optional transformations.

**Parameters:**
- `file: string | DirectusFiles` - File ID or file object
- `options?: DirectusFileOptions` - Transformation options

**Returns:** `string`

```typescript
// Basic URL
const url = getDirectusFileUrl('file-uuid')

// With transformations
const url = getDirectusFileUrl('file-uuid', {
  width: 800,
  height: 600,
  quality: 80,
  fit: 'cover',
  format: 'webp',
})

// From file object
const file = await directus.request(readFile('file-uuid'))
const url = getDirectusFileUrl(file, { width: 400 })

// Download link
const downloadUrl = getDirectusFileUrl(file, {
  download: true,
  filename: 'custom-name.jpg',
})
```

**Options:**

```typescript
interface DirectusFileOptions {
  filename?: string              // Custom filename for downloads
  download?: boolean             // Force download
  width?: number                 // Resize width
  height?: number                // Resize height
  quality?: number               // Image quality (1-100)
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  format?: 'jpg' | 'png' | 'webp' | 'tiff' | 'avif'
  withoutEnlargement?: boolean   // Prevent upscaling
  key?: string                   // Access key for private files
}
```

**Examples:**

```typescript
// Responsive image sizes
const thumbnail = getDirectusFileUrl(file, { width: 200, format: 'webp' })
const medium = getDirectusFileUrl(file, { width: 800, format: 'webp' })
const large = getDirectusFileUrl(file, { width: 1600, format: 'webp' })

// High-quality cover image
const cover = getDirectusFileUrl(file, {
  width: 1920,
  height: 1080,
  fit: 'cover',
  quality: 90,
  format: 'webp',
})

// Optimized thumbnail
const thumb = getDirectusFileUrl(file, {
  width: 300,
  height: 300,
  fit: 'cover',
  quality: 70,
  format: 'webp',
  withoutEnlargement: true,
})
```