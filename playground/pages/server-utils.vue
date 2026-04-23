<script setup lang="ts">
import { ref, useDirectusAuth } from '#imports'

const { loggedIn } = useDirectusAuth()

const adminResult = ref<any>(null)
const sessionResult = ref<any>(null)
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
  <div>
    <h1>Server-side Composables</h1>
    <p>
      These composables are only available in Nitro server routes (<code>server/api/*.ts</code>).
      This page calls each API route and displays the result.
    </p>

    <div class="demo-section">
      <h2><code>useAdminDirectus()</code></h2>
      <p>
        Creates a Directus client authenticated with <code>DIRECTUS_ADMIN_TOKEN</code>.
        Use this for privileged operations that should not depend on the current user's session.
      </p>
      <button @click="fetchAdmin">
        Call /api/admin
      </button>
      <pre v-if="adminResult">{{ JSON.stringify(adminResult, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2><code>useSessionDirectus(event)</code></h2>
      <p>
        Creates a Directus client that forwards the current user's session cookie.
        Requests run with that user's permissions - not admin privileges.
        <span v-if="!loggedIn" class="warning">Log in first to see your session data.</span>
      </p>
      <button @click="fetchSession">
        Call /api/user-session
      </button>
      <pre v-if="sessionResult">{{ JSON.stringify(sessionResult, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2><code>useTokenDirectus(token)</code></h2>
      <p>
        Creates a Directus client authenticated with an explicit static token.
        Useful for service accounts or integrations where you manage tokens directly.
      </p>
      <form class="form-inline" @submit.prevent="fetchToken">
        <label>
          Token
          <input v-model="tokenInput" type="text" placeholder="your-static-token" required style="width: 280px">
        </label>
        <button type="submit">
          Call /api/token
        </button>
      </form>
      <pre v-if="tokenResult">{{ JSON.stringify(tokenResult, null, 2) }}</pre>
    </div>
  </div>
</template>
