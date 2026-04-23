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
  catch (e: any) {
    error.value = e?.message ?? 'Unknown error'
  }
}
</script>

<template>
  <div>
    <h1>Profile</h1>
    <p>
      Demonstrates <code>useDirectusAuth().readMe()</code> and <code>updateMe()</code>.
      This page is protected by the <code>auth</code> middleware.
    </p>

    <form @submit.prevent="submit">
      <label>
        First name
        <input v-model="form.first_name" type="text" autocomplete="given-name">
      </label>
      <label>
        Last name
        <input v-model="form.last_name" type="text" autocomplete="family-name">
      </label>
      <label>
        Email (read-only)
        <input :value="form.email" type="email" disabled>
      </label>
      <button type="submit">
        Save
      </button>
      <span v-if="saved" class="success">Saved.</span>
      <span v-if="error" class="error">{{ error }}</span>
    </form>

    <h2>Raw user state</h2>
    <pre>{{ JSON.stringify(user, null, 2) }}</pre>

    <p class="note">
      Note: The <code>user</code> variable returns the <code>readMeFields</code> in nuxt.config.ts options.
    </p>

    <div class="demo-section">
      <h2><code>useDirectusUser()</code></h2>
      <p>
        A lightweight composable that returns only the user <code>Ref</code> directly, without the full <code>useDirectusAuth()</code> object.
        Useful when you only need to read user state.
        It accesses the same shared <code>useState</code> as <code>useDirectusAuth().user</code> - no extra network request.
      </p>
      <pre>{{ JSON.stringify(useDirectusUser(), null, 2) }}</pre>
    </div>
  </div>
</template>
