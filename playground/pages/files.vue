<script setup lang="ts">
import type { DirectusThumbnailFit, DirectusThumbnailFormat } from '#imports'
import { computed, getDirectusFileUrl, ref, uploadDirectusFile, uploadDirectusFiles } from '#imports'

const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<Awaited<ReturnType<typeof uploadDirectusFile>> | null>(null)
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
  catch (error: unknown) {
    uploadError.value = error instanceof Error ? error.message : String(error)
  }
}

const batchInput = ref<HTMLInputElement | null>(null)
const batchResult = ref<Awaited<ReturnType<typeof uploadDirectusFiles>>[]>([])
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
  catch (error: unknown) {
    batchError.value = error instanceof Error ? error.message : String(error)
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

const fitOptions = [
  { label: 'cover', value: 'cover' },
  { label: 'contain', value: 'contain' },
  { label: 'inside', value: 'inside' },
  { label: 'outside', value: 'outside' },
]
const formatOptions = [
  { label: 'webp', value: 'webp' },
  { label: 'jpg', value: 'jpg' },
  { label: 'png', value: 'png' },
  { label: 'avif', value: 'avif' },
]

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
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Files
      </h1>
      <p class="text-muted">
        Demonstrates file upload and asset URL generation. You must be logged in to upload (Directus permission check).
      </p>
    </div>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-3">
        Single upload - <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">uploadDirectusFile()</code>
      </h2>
      <form
        class="flex items-end gap-2 mb-3"
        @submit.prevent="handleUpload"
      >
        <input
          ref="fileInput"
          type="file"
          required
          class="text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:text-inverted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-primary/90"
        >
        <UButton
          type="submit"
          color="primary"
          size="sm"
        >
          Upload
        </UButton>
      </form>
      <UAlert
        v-if="uploadError"
        color="error"
        variant="soft"
        :title="uploadError"
        class="mb-3"
      />
      <pre
        v-if="uploadedFile"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto"
      >{{ JSON.stringify(uploadedFile, null, 2) }}</pre>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Batch upload - <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">uploadDirectusFiles()</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Accepts an array of <code class="text-xs bg-elevated px-1 py-0.5 rounded">{ file, data? }</code> objects and uploads them all.
      </p>
      <form
        class="flex items-end gap-2 mb-3"
        @submit.prevent="handleBatchUpload"
      >
        <input
          ref="batchInput"
          type="file"
          multiple
          required
          class="text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:text-inverted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-primary/90"
        >
        <UButton
          type="submit"
          color="primary"
          size="sm"
        >
          Upload all
        </UButton>
      </form>
      <UAlert
        v-if="batchError"
        color="error"
        variant="soft"
        :title="batchError"
        class="mb-3"
      />
      <pre
        v-if="batchResult.length"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto"
      >{{ JSON.stringify(batchResult, null, 2) }}</pre>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Asset URL - <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">getDirectusFileUrl()</code>
      </h2>
      <p class="text-sm text-muted mb-4">
        Generates a Directus asset URL with transformation parameters.
        Upload a file above to populate the ID automatically, or paste one manually.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-2xl">
        <UFormField label="File ID">
          <UInput
            v-model="fileIdInput"
            :placeholder="uploadedFile?.id ?? 'paste-file-id-here'"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Width">
          <UInputNumber
            v-model="urlOptions.width"
            :min="0"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Height">
          <UInputNumber
            v-model="urlOptions.height"
            :min="0"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Quality">
          <UInputNumber
            v-model="urlOptions.quality"
            :min="1"
            :max="100"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Fit">
          <USelect
            v-model="urlOptions.fit"
            :items="fitOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Format">
          <USelect
            v-model="urlOptions.format"
            :items="formatOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Download filename"
          class="md:col-span-3"
        >
          <UInput
            v-model="urlOptions.filename"
            placeholder="my-file.jpg"
            class="w-full"
          />
        </UFormField>
        <div class="md:col-span-3 flex flex-wrap gap-4">
          <UCheckbox
            v-model="urlOptions.download"
            label="Force download"
          />
          <UCheckbox
            v-model="urlOptions.withoutEnlargement"
            label="Without enlargement"
          />
        </div>
      </div>

      <div
        v-if="generatedUrl"
        class="space-y-3"
      >
        <p class="text-sm font-semibold">
          Generated URL:
        </p>
        <code class="block bg-elevated border border-default rounded p-3 text-xs wrap-break-word">{{ generatedUrl }}</code>
        <div v-if="!urlOptions.download">
          <NuxtImg
            provider="directus"
            :src="fileIdInput || uploadedFile?.id"
            :width="urlOptions.width"
            :height="urlOptions.height"
            :fit="urlOptions.fit"
            :format="urlOptions.format"
            :quality="urlOptions.quality"
            alt="Preview"
            class="max-w-full rounded border border-default"
          />
        </div>
      </div>
    </section>
  </div>
</template>
