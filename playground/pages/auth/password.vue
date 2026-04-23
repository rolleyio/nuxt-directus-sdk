<script setup lang="ts">
import { ref, useDirectusAuth } from '#imports'

const { passwordRequest, passwordReset } = useDirectusAuth()

const step = ref<'request' | 'reset'>('request')
const email = ref('')
const token = ref('')
const newPassword = ref('')
const message = ref('')
const error = ref('')

async function submitRequest() {
  message.value = ''
  error.value = ''
  try {
    await passwordRequest(email.value)
    message.value = 'Reset email sent. Check your inbox for the token.'
    step.value = 'reset'
  }
  catch (e: any) {
    error.value = e?.message ?? 'Unknown error'
  }
}

async function submitReset() {
  message.value = ''
  error.value = ''
  try {
    await passwordReset(token.value, newPassword.value)
    message.value = 'Password updated. You can now log in.'
    step.value = 'request'
    token.value = ''
    newPassword.value = ''
  }
  catch (e: any) {
    error.value = e?.message ?? 'Unknown error'
  }
}
</script>

<template>
  <div>
    <h1>Password Reset</h1>
    <p>
      Demonstrates <code>useDirectusAuth().passwordRequest(email)</code> and
      <code>passwordReset(token, newPassword)</code>.
    </p>
    <div class="config-notice config-notice--directus">
      <span class="config-notice-badge">
        <img src="~/assets/directus-logo.svg" width="12" height="12" alt="">
        Directus Config Required
      </span>
      Requires the <code>PASSWORD_RESET_URL_ALLOW_LIST</code> environment variable to be set in your Directus instance.
      The URL receives the reset token as a query param.
    </div>

    <template v-if="step === 'request'">
      <h2>Step 1 - Request reset email</h2>
      <form @submit.prevent="submitRequest">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <button type="submit">
          Send Reset Email
        </button>
      </form>
    </template>

    <template v-else>
      <h2>Step 2 - Set new password</h2>
      <form @submit.prevent="submitReset">
        <label>
          Token (from the reset email link)
          <input v-model="token" type="text" required>
        </label>
        <label>
          New password
          <input v-model="newPassword" type="password" autocomplete="new-password" required>
        </label>
        <div class="actions">
          <button type="submit">
            Reset Password
          </button>
          <button type="button" class="secondary" @click="step = 'request'">
            Back
          </button>
        </div>
      </form>
    </template>

    <p v-if="message" class="success">
      {{ message }}
    </p>
    <p v-if="error" class="error">
      {{ error }}
    </p>
    <div class="config-notice config-notice--directus">
      <span class="config-notice-badge">
        <img src="~/assets/directus-logo.svg" width="12" height="12" alt="">
        Directus Config Required
      </span>
      The <code>directus-template-cli</code> <code>cms</code> example template uses a dummy email address, and therefore you'll need to register a new user and ensure your Directus instance is configured with a mail sender to test this feature.
    </div>
  </div>
</template>
