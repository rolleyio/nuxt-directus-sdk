<script lang="ts" setup>
import { reactive, readProviders, useAsyncData, useDirectus, useDirectusAuth } from '#imports'

const { user, login, loginWithProvider, loggedIn } = useDirectusAuth()
const directus = useDirectus()

const form = reactive({
  email: 'admin@example.com',
  password: 'd1r3ctu5',
})

async function loginForm() {
  await login(form.email, form.password)
}

async function providerLogin(provider: string) {
  await loginWithProvider(provider)
}

const { data: ssoProviders } = await useAsyncData('ssoProviders', () =>
  directus.request(readProviders()))
</script>

<template>
  <div>
    <div v-if="!loggedIn">
      <h1>Login with default provider (username and password)</h1>
      <form
        v-if="!loggedIn"
        @submit.prevent="loginForm"
      >
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

        <button>Submit</button>
      </form>
      <h1>Login with Providers</h1>
      <div v-for="provider in ssoProviders" :key="provider.name">
        <button @click="providerLogin(provider.name)">
          Log in with {{ provider.name }}
        </button>
      </div>
    </div>
    <div v-else>
      <p>You're logged in as:</p>
      <pre>{{ user }}</pre>
      <NuxtLink to="/auth/logout">
        Click to Logout
      </NuxtLink>
    </div>
  </div>
</template>
