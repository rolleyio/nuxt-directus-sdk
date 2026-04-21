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
    <h1>Middleware</h1>
    <p>Demonstrates <code>useDirectusAuth().register()</code>.</p>
    <p class="note">
      The <code>directus-template-cli</code> <code>cms</code> is not configured for public registration by default.
      You can login as an administrator to register a new user or configure your directus instance to enable public registration to use this playground page.
    </p>
    <form @submit.prevent="registerForm">
      <div>
        <label for="first_name-input">First Name</label>
        <input
          id="first_name-input"
          v-model="form.first_name"
          autocomplete="given-name"
          required
        >
      </div>
      <div>
        <label for="last_name-input">Last Name</label>
        <input
          id="last_name-input"
          v-model="form.last_name"
          autocomplete="family-name"
          required
        >
      </div>
      <div>
        <label for="email-input">Email</label>
        <input
          id="email-input"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
        >
      </div>

      <div>
        <label for="password-input">Password</label>
        <input
          id="password-input"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
        >
      </div>

      <button>Register New User</button>
    </form>
  </div>
</template>
