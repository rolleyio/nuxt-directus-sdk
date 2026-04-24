<script setup lang="ts">
import { definePageMeta, reactive, ref, useDirectusAuth, useDirectusUser } from '#imports'

definePageMeta({
  middleware: ['auth'],
})

const { user, readMe, updateMe } = useDirectusAuth()

await readMe()

const form = reactive({
  first_name: user.value?.first_name ?? '',
  last_name: user.value?.last_name ?? '',
  email: user.value?.email ?? '',
})

const saved = ref(false)
const error = ref('')

async function submit() {
  saved.value = false
  error.value = ''
  try {
    await updateMe({ first_name: form.first_name, last_name: form.last_name })
    saved.value = true
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Profile
      </h1>
      <p class="text-muted">
        Demonstrates <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusAuth().readMe()</code> and <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">updateMe()</code>.
        This page is protected by the <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">auth</code> middleware.
      </p>
    </div>

    <UForm
      :state="form"
      class="space-y-4 max-w-sm"
      @submit="submit"
    >
      <UFormField
        label="First name"
        name="first_name"
      >
        <UInput
          v-model="form.first_name"
          autocomplete="given-name"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Last name"
        name="last_name"
      >
        <UInput
          v-model="form.last_name"
          autocomplete="family-name"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Email (read-only)"
        name="email"
      >
        <UInput
          :model-value="form.email"
          type="email"
          disabled
          class="w-full"
        />
      </UFormField>
      <div class="flex items-center gap-3">
        <UButton
          type="submit"
          color="primary"
        >
          Save
        </UButton>
        <span
          v-if="saved"
          class="text-sm text-success"
        >Saved.</span>
        <span
          v-if="error"
          class="text-sm text-error"
        >{{ error }}</span>
      </div>
    </UForm>

    <div>
      <h2 class="text-base font-semibold mb-2">
        Raw user state
      </h2>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto">{{ JSON.stringify(user, null, 2) }}</pre>
      <p class="text-xs text-muted italic mt-2 border-l-2 border-default pl-3">
        Note: The <code class="text-xs bg-elevated px-1 py-0.5 rounded">user</code> variable returns the <code class="text-xs bg-elevated px-1 py-0.5 rounded">readMeFields</code> in nuxt.config.ts options.
      </p>
    </div>

    <div class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusUser()</code>
      </h2>
      <p class="text-muted text-sm mb-3">
        A lightweight composable that returns only the user <code>Ref</code> directly, without the full <code>useDirectusAuth()</code> object.
        Useful when you only need to read user state.
        It accesses the same shared <code>useState</code> as <code>useDirectusAuth().user</code> - no extra network request.
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto">{{ JSON.stringify(useDirectusUser(), null, 2) }}</pre>
    </div>
  </div>
</template>
