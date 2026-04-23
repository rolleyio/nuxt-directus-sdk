<script setup lang="ts">
import { ref, useDirectusAuth } from '#imports'

const { loggedIn } = useDirectusAuth()

// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminResult = ref<any>(null)
// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionResult = ref<any>(null)
// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tokenResult = ref<any>(null)
const tokenInput = ref('')

async function fetchAdmin() {
  adminResult.value = await $fetch('/api/admin')
}

async function fetchSession() {
  sessionResult.value = await $fetch('/api/user-session')
}

async function fetchToken() {
  sessionResult.value = null
  tokenResult.value = await $fetch(`/api/token?token=${encodeURIComponent(tokenInput.value)}`)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Server-side Composables
      </h1>
      <p class="text-muted">
        These composables are only available in Nitro server routes (<code class="text-xs bg-elevated px-1 py-0.5 rounded">server/api/*.ts</code>).
        This page calls each API route and displays the result.
      </p>
    </div>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useAdminDirectus()</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Creates a Directus client authenticated with <code class="text-xs bg-elevated px-1 py-0.5 rounded">DIRECTUS_ADMIN_TOKEN</code>.
        Use this for privileged operations that should not depend on the current user's session.
      </p>
      <UButton
        color="primary"
        @click="fetchAdmin"
      >
        Call /api/admin
      </UButton>
      <pre
        v-if="adminResult"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mt-3"
      >{{ JSON.stringify(adminResult, null, 2) }}</pre>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useSessionDirectus(event)</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Creates a Directus client that forwards the current user's session cookie.
        Requests run with that user's permissions - not admin privileges.
      </p>
      <UAlert
        v-if="!loggedIn"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="Log in first to see your session data."
        class="mb-3"
      />
      <UButton
        color="primary"
        @click="fetchSession"
      >
        Call /api/user-session
      </UButton>
      <pre
        v-if="sessionResult"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mt-3"
      >{{ JSON.stringify(sessionResult, null, 2) }}</pre>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useTokenDirectus(token)</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Creates a Directus client authenticated with an explicit static token.
        Useful for service accounts or integrations where you manage tokens directly.
      </p>
      <form
        class="flex items-end gap-2"
        @submit.prevent="fetchToken"
      >
        <UFormField
          label="Token"
          class="flex-1 max-w-md"
        >
          <UInput
            v-model="tokenInput"
            placeholder="your-static-token"
            required
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          color="primary"
        >
          Call /api/token
        </UButton>
      </form>
      <pre
        v-if="tokenResult"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mt-3"
      >{{ JSON.stringify(tokenResult, null, 2) }}</pre>
    </section>
  </div>
</template>
