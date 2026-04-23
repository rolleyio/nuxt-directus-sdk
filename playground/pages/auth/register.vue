<script setup lang="ts">
import { reactive, useDirectusAuth } from '#imports'

const { register } = useDirectusAuth()
const form = reactive({
  email: 'new-user@example.com',
  password: 'v3rys3cur!tyf0cu$ed',
  first_name: 'Joe',
  last_name: 'Smith',
})

async function registerForm() {
  await register({
    email: form.email,
    password: form.password,
    first_name: form.first_name,
    last_name: form.last_name,
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Register
      </h1>
      <p class="text-muted">
        Demonstrates <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusAuth().register()</code>.
      </p>
    </div>

    <ConfigNotice>
      The <code>directus-template-cli</code> <code>cms</code> is not configured for public registration by default.
      You can login as an administrator to register a new user or configure your Directus instance to enable public registration to use this playground page.
    </ConfigNotice>

    <UForm :state="form" class="space-y-4 max-w-sm" @submit="registerForm">
      <UFormField label="First Name" name="first_name" required>
        <UInput v-model="form.first_name" autocomplete="given-name" required class="w-full" />
      </UFormField>
      <UFormField label="Last Name" name="last_name" required>
        <UInput v-model="form.last_name" autocomplete="family-name" required class="w-full" />
      </UFormField>
      <UFormField label="Email" name="email" required>
        <UInput v-model="form.email" type="email" autocomplete="email" required class="w-full" />
      </UFormField>
      <UFormField label="Password" name="password" required>
        <UInput v-model="form.password" type="password" autocomplete="new-password" required class="w-full" />
      </UFormField>
      <UButton type="submit" color="primary">
        Register New User
      </UButton>
    </UForm>
  </div>
</template>
