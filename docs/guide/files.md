# File Management

nuxt-directus-sdk provides utilities for uploading files to Directus and generating optimized image URLs with transformation options.

## File Uploads

### Upload Single File

```typescript
const file = event.target.files[0]

const uploadedFile = await uploadDirectusFile({
  file,
  data: {
    title: 'My Image',
    folder: 'folder-id',
  }
})

console.log('File uploaded:', uploadedFile.id)
```

### Upload Multiple Files

```typescript
const files = Array.from(event.target.files).map(file => ({
  file,
  data: {
    folder: 'folder-id',
  }
}))

const uploadedFiles = await uploadDirectusFiles(files)

console.log('Uploaded files:', uploadedFiles)
```

### Complete Upload Example

```vue
<script setup>
const uploading = ref(false)
const uploadedFile = ref(null)

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true

  try {
    uploadedFile.value = await uploadDirectusFile({
      file,
      data: {
        title: file.name,
        description: 'Uploaded from Nuxt app',
      }
    })

    console.log('Upload successful:', uploadedFile.value)
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <input type="file" @change="handleFileUpload" :disabled="uploading" />

    <div v-if="uploading">
      Uploading...
    </div>

    <div v-if="uploadedFile">
      <p>File uploaded successfully!</p>
      <img :src="getDirectusFileUrl(uploadedFile.id, { width: 300 })" />
    </div>
  </div>
</template>
```

## File URLs

### Basic File URL

```typescript
// From file ID
const url = getDirectusFileUrl('file-uuid')

// From file object
const file = await directus.request(readFile('file-uuid'))
const url = getDirectusFileUrl(file)
```

### Image Transformations

The `getDirectusFileUrl()` function supports all Directus asset transformation parameters:

```typescript
const url = getDirectusFileUrl('file-uuid', {
  width: 800,
  height: 600,
  quality: 80,
  fit: 'cover',
  format: 'webp',
})
```

## Transformation Options

### Width & Height

Resize images to specific dimensions:

```typescript
// Fixed width, auto height
getDirectusFileUrl(file, { width: 800 })

// Fixed height, auto width
getDirectusFileUrl(file, { height: 600 })

// Fixed width and height
getDirectusFileUrl(file, { width: 800, height: 600 })
```

### Fit Modes

Control how images are resized:

```typescript
// Cover - crop to fill dimensions (default)
getDirectusFileUrl(file, { width: 800, height: 600, fit: 'cover' })

// Contain - resize to fit within dimensions
getDirectusFileUrl(file, { width: 800, height: 600, fit: 'contain' })

// Inside - resize only if larger
getDirectusFileUrl(file, { width: 800, height: 600, fit: 'inside' })

// Outside - resize to cover dimensions
getDirectusFileUrl(file, { width: 800, height: 600, fit: 'outside' })
```

### Format Conversion

Convert images to different formats:

```typescript
// Convert to WebP
getDirectusFileUrl(file, { format: 'webp' })

// Convert to AVIF (modern format, better compression)
getDirectusFileUrl(file, { format: 'avif' })

// Other formats: jpg, png, tiff
getDirectusFileUrl(file, { format: 'jpg' })
```

### Quality

Control image compression (1-100):

```typescript
// Low quality, smaller file
getDirectusFileUrl(file, { quality: 60 })

// High quality
getDirectusFileUrl(file, { quality: 90 })

// Combined with format
getDirectusFileUrl(file, { format: 'webp', quality: 80 })
```

### Prevent Enlargement

Prevent upscaling of small images:

```typescript
getDirectusFileUrl(file, {
  width: 1920,
  withoutEnlargement: true, // Won't upscale if original is smaller
})
```

### Download Files

Generate download links:

```typescript
// Force download
getDirectusFileUrl(file, { download: true })

// Download with custom filename
getDirectusFileUrl(file, {
  download: true,
  filename: 'my-custom-filename.jpg'
})
```

## Responsive Images

Create responsive images with multiple sizes:

```vue
<script setup>
const props = defineProps({
  image: Object,
  alt: String,
})

const sizes = {
  small: getDirectusFileUrl(props.image, { width: 400, format: 'webp' }),
  medium: getDirectusFileUrl(props.image, { width: 800, format: 'webp' }),
  large: getDirectusFileUrl(props.image, { width: 1200, format: 'webp' }),
}
</script>

<template>
  <img
    :src="sizes.medium"
    :srcset="`
      ${sizes.small} 400w,
      ${sizes.medium} 800w,
      ${sizes.large} 1200w
    `"
    sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
    :alt="alt"
  />
</template>
```

## Using with Nuxt Image

The module integrates with `@nuxt/image` for advanced image optimization:

```vue
<script setup>
const props = defineProps({
  fileId: String,
})
</script>

<template>
  <NuxtImg
    provider="directus"
    :src="fileId"
    width="800"
    height="600"
    format="webp"
    quality="80"
    fit="cover"
  />
</template>
```

## File Management

### Reading Files

```typescript
const directus = useDirectus()

// Get single file
const file = await directus.request(readFile('file-uuid'))

// Get all files
const files = await directus.request(readFiles())

// Get files with query
const images = await directus.request(readFiles({
  filter: {
    type: { _starts_with: 'image/' }
  },
  limit: 10,
}))
```

### Updating Files

```typescript
// Update file metadata
await directus.request(updateFile('file-uuid', {
  title: 'Updated Title',
  description: 'New description',
}))
```

### Deleting Files

```typescript
// Delete single file
await directus.request(deleteFile('file-uuid'))

// Delete multiple files
await directus.request(deleteFiles(['uuid1', 'uuid2']))
```

## Advanced Examples

### Image Gallery

```vue
<script setup>
const directus = useDirectus()
const uploading = ref(false)

// Load existing images
const { data: images } = await useAsyncData('gallery', () =>
  directus.request(readFiles({
    filter: { type: { _starts_with: 'image/' } },
    sort: ['-uploaded_on'],
  }))
)

async function handleUpload(event) {
  const files = Array.from(event.target.files).map(file => ({ file }))
  uploading.value = true

  try {
    const uploaded = await uploadDirectusFiles(files)
    images.value = [
      ...(Array.isArray(uploaded) ? uploaded : [uploaded]),
      ...(images.value || [])
    ]
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <input
      type="file"
      multiple
      accept="image/*"
      @change="handleUpload"
      :disabled="uploading"
    />

    <div class="gallery">
      <div v-for="image in images" :key="image.id" class="gallery-item">
        <img
          :src="getDirectusFileUrl(image, {
            width: 300,
            height: 300,
            fit: 'cover',
            format: 'webp',
            quality: 80
          })"
          :alt="image.title"
        />
        <p>{{ image.title }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
```

### Optimized Hero Image

```vue
<script setup>
const props = defineProps({
  image: Object,
})

// Generate optimized URLs for different formats and sizes
const sources = {
  avif: {
    desktop: getDirectusFileUrl(props.image, {
      width: 1920,
      format: 'avif',
      quality: 75
    }),
    mobile: getDirectusFileUrl(props.image, {
      width: 768,
      format: 'avif',
      quality: 75
    }),
  },
  webp: {
    desktop: getDirectusFileUrl(props.image, {
      width: 1920,
      format: 'webp',
      quality: 80
    }),
    mobile: getDirectusFileUrl(props.image, {
      width: 768,
      format: 'webp',
      quality: 80
    }),
  },
  jpg: {
    desktop: getDirectusFileUrl(props.image, {
      width: 1920,
      format: 'jpg',
      quality: 85
    }),
    mobile: getDirectusFileUrl(props.image, {
      width: 768,
      format: 'jpg',
      quality: 85
    }),
  },
}
</script>

<template>
  <picture>
    <!-- AVIF format (best compression) -->
    <source
      :srcset="`${sources.avif.mobile} 768w, ${sources.avif.desktop} 1920w`"
      type="image/avif"
      sizes="100vw"
    />

    <!-- WebP format (good compression) -->
    <source
      :srcset="`${sources.webp.mobile} 768w, ${sources.webp.desktop} 1920w`"
      type="image/webp"
      sizes="100vw"
    />

    <!-- JPG fallback -->
    <img
      :src="sources.jpg.desktop"
      :srcset="`${sources.jpg.mobile} 768w, ${sources.jpg.desktop} 1920w`"
      sizes="100vw"
      :alt="image.title"
      loading="lazy"
    />
  </picture>
</template>
```

## API Reference

### `uploadDirectusFile(file, query?)`

Upload a single file to Directus.

**Parameters:**
- `file: { file: File, data?: Partial<DirectusFiles> }` - File and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles>`

### `uploadDirectusFiles(files, query?)`

Upload multiple files to Directus.

**Parameters:**
- `files: Array<{ file: File, data?: Partial<DirectusFiles> }>` - Files and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles[]>`

### `getDirectusFileUrl(file, options?)`

Generate a URL for a Directus file with optional transformations.

**Parameters:**
- `file: string | DirectusFiles` - File ID or file object
- `options?: DirectusFileOptions` - Transformation options

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

**Returns:** `string` - Full URL to the file

## See Also

- [Directus Files Documentation](https://docs.directus.io/reference/files.html)
- [Getting Started](/guide/getting-started)
- [Configuration Reference](/api/configuration)
