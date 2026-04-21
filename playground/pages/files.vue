<script setup lang="ts">
import type { DirectusThumbnailFit, DirectusThumbnailFormat } from '#imports'
import { computed, getDirectusFileUrl, ref, uploadDirectusFile, uploadDirectusFiles } from '#imports'

const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<any>(null)
const uploadError = ref('')

async function handleUpload() {
  uploadError.value = ''
  uploadedFile.value = null
  const file = fileInput.value?.files?.[0]
  if (!file)
    return
  try {
    uploadedFile.value = await uploadDirectusFile({ file })
  }
  catch (e: any) {
    uploadError.value = e?.message ?? 'Upload failed'
  }
}

const batchInput = ref<HTMLInputElement | null>(null)
const batchResult = ref<any[]>([])
const batchError = ref('')

async function handleBatchUpload() {
  batchError.value = ''
  batchResult.value = []
  const files = Array.from(batchInput.value?.files ?? [])
  if (!files.length)
    return
  try {
    const result = await uploadDirectusFiles(files.map(file => ({ file })))
    batchResult.value = Array.isArray(result) ? result : [result]
  }
  catch (e: any) {
    batchError.value = e?.message ?? 'Upload failed'
  }
}

const fileIdInput = ref('')

const urlOptions = ref({
  width: 400,
  height: 300,
  fit: 'cover' as DirectusThumbnailFit,
  format: 'webp' as DirectusThumbnailFormat,
  quality: 80,
  withoutEnlargement: false,
  download: false,
  filename: '',
})

const generatedUrl = computed(() => {
  const id = fileIdInput.value || uploadedFile.value?.id
  if (!id)
    return ''
  return getDirectusFileUrl(id, {
    width: urlOptions.value.width || undefined,
    height: urlOptions.value.height || undefined,
    fit: urlOptions.value.fit || undefined,
    format: urlOptions.value.format || undefined,
    quality: urlOptions.value.quality || undefined,
    withoutEnlargement: urlOptions.value.withoutEnlargement || undefined,
    download: urlOptions.value.download || undefined,
    filename: urlOptions.value.filename || undefined,
  })
})
</script>

<template>
  <div>
    <h1>Files</h1>
    <p>
      Demonstrates file upload and asset URL generation. You must be logged in to upload (Directus permission check).
    </p>

    <div class="demo-section">
      <h2>Single upload - <code>uploadDirectusFile()</code></h2>
      <form class="form-inline" @submit.prevent="handleUpload">
        <input ref="fileInput" type="file" required>
        <button type="submit">
          Upload
        </button>
      </form>
      <p v-if="uploadError" class="error">
        {{ uploadError }}
      </p>
      <pre v-if="uploadedFile">{{ JSON.stringify(uploadedFile, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2>Batch upload - <code>uploadDirectusFiles()</code></h2>
      <p>Accepts an array of <code>{ file, data? }</code> objects and uploads them all.</p>
      <form class="form-inline" @submit.prevent="handleBatchUpload">
        <input ref="batchInput" type="file" multiple required>
        <button type="submit">
          Upload all
        </button>
      </form>
      <p v-if="batchError" class="error">
        {{ batchError }}
      </p>
      <pre v-if="batchResult.length">{{ JSON.stringify(batchResult, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2>Asset URL - <code>getDirectusFileUrl()</code></h2>
      <p>
        Generates a Directus asset URL with transformation parameters
        Upload a file above to populate the ID automatically, or paste one manually.
      </p>

      <div class="controls">
        <label>
          File ID
          <input v-model="fileIdInput" type="text" :placeholder="uploadedFile?.id ?? 'paste-file-id-here'">
        </label>
        <label>
          Width
          <input v-model.number="urlOptions.width" type="number" min="0">
        </label>
        <label>
          Height
          <input v-model.number="urlOptions.height" type="number" min="0">
        </label>
        <label>
          Quality
          <input v-model.number="urlOptions.quality" type="number" min="1" max="100">
        </label>
        <label>
          Fit
          <select v-model="urlOptions.fit">
            <option value="cover">cover</option>
            <option value="contain">contain</option>
            <option value="inside">inside</option>
            <option value="outside">outside</option>
          </select>
        </label>
        <label>
          Format
          <select v-model="urlOptions.format">
            <option value="webp">webp</option>
            <option value="jpg">jpg</option>
            <option value="png">png</option>
            <option value="avif">avif</option>
          </select>
        </label>
        <label>
          Download filename
          <input v-model="urlOptions.filename" type="text" placeholder="my-file.jpg">
        </label>
        <label class="checkbox-label">
          <input v-model="urlOptions.download" type="checkbox">
          Force download
        </label>
        <label class="checkbox-label">
          <input v-model="urlOptions.withoutEnlargement" type="checkbox">
          Without enlargement
        </label>
      </div>

      <div v-if="generatedUrl" class="url-result">
        <p class="url-label">
          Generated URL:
        </p>
        <code class="url">{{ generatedUrl }}</code>
        <div v-if="!urlOptions.download" class="preview">
          <NuxtImg
            provider="directus"
            :src="fileIdInput || uploadedFile?.id"
            :width="urlOptions.width"
            :height="urlOptions.height"
            :fit="urlOptions.fit"
            :format="urlOptions.format"
            :quality="urlOptions.quality"
            alt="Preview"
          />
        </div>
      </div>
    </div>
  </div>
</template>
