<script setup lang="ts">
import { reactive, ref, useDirectusAuth } from '#imports'

const { passwordRequest, passwordReset } = useDirectusAuth()

const step = ref<'request' | 'reset'>('request')
const requestState = reactive({ email: '' })
const resetState = reactive({ token: '', newPassword: '' })
const message = ref('')
const errorMessage = ref('')

async function submitRequest() {
  message.value = ''
  errorMessage.value = ''
  try {
    await passwordRequest(requestState.email)
    message.value = 'Reset email sent. Check your inbox for the token.'
    step.value = 'reset'
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}

async function submitReset() {
  message.value = ''
  errorMessage.value = ''
  try {
    await passwordReset(resetState.token, resetState.newPassword)
    message.value = 'Password updated. You can now log in.'
    step.value = 'request'
    resetState.token = ''
    resetState.newPassword = ''
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Password Reset
      </h1>
      <p class="text-muted">
        Demonstrates <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusAuth().passwordRequest(email)</code> and
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">passwordReset(token, newPassword)</code>.
      </p>
    </div>

    <ConfigNotice>
      Requires the <code>PASSWORD_RESET_URL_ALLOW_LIST</code> environment variable to be set in your Directus instance.
      The URL receives the reset token as a query param.
    </ConfigNotice>

    <template v-if="step === 'request'">
      <h2 class="text-base font-semibold mb-3">
        Step 1 - Request reset email
      </h2>
      <UForm
        :state="requestState"
        class="space-y-4 max-w-sm"
        @submit="submitRequest"
      >
        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="requestState.email"
            type="email"
            autocomplete="email"
            required
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          color="primary"
        >
          Send Reset Email
        </UButton>
      </UForm>
    </template>

    <template v-else>
      <h2 class="text-base font-semibold mb-3">
        Step 2 - Set new password
      </h2>
      <UForm
        :state="resetState"
        class="space-y-4 max-w-sm"
        @submit="submitReset"
      >
        <UFormField
          label="Token (from the reset email link)"
          name="token"
          required
        >
          <UInput
            v-model="resetState.token"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="New password"
          name="newPassword"
          required
        >
          <UInput
            v-model="resetState.newPassword"
            type="password"
            autocomplete="new-password"
            required
            class="w-full"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton
            type="submit"
            color="primary"
          >
            Reset Password
          </UButton>
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            @click="step = 'request'"
          >
            Back
          </UButton>
        </div>
      </UForm>
    </template>

    <UAlert
      v-if="message"
      color="success"
      variant="soft"
      class="mt-4"
      :title="message"
    />
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      class="mt-4"
      :title="errorMessage"
    />

    <ConfigNotice class="mt-6">
      The <code>directus-template-cli</code> <code>cms</code> example template uses a dummy email address, and therefore you'll need to register a new user and ensure your Directus instance is configured with a mail sender to test this feature.
    </ConfigNotice>
  </div>
</template>
