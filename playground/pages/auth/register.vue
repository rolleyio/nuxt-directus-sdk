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
    const result = await register({
      email: form.email,
      password: form.password,
      first_name: form.first_name,
      last_name: form.last_name,
    })
  }
</script>
<template>
  <form @submit.prevent="registerForm">
    <div>
      <label for="first_name-input">First Name</label>
      <input
        id="first_name-input"
        v-model="form.first_name"
        autocomplete="given-name"
        required />
    </div>
    <div>
      <label for="last_name-input">Last Name</label>
      <input
        id="last_name-input"
        v-model="form.last_name"
        autocomplete="family-name"
        required />
    </div>
    <div>
      <label for="email-input">Email</label>
      <input
        id="email-input"
        v-model="form.email"
        type="email"
        autocomplete="email"
        required />
    </div>

    <div>
      <label for="password-input">Password</label>
      <input
        id="password-input"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        required />
    </div>

    <button>Register New User</button>
  </form>
</template>
