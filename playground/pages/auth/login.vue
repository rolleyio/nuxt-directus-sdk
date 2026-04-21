<script lang="ts" setup>
import { reactive, readProviders, ref, useAsyncData, useDirectus, useDirectusAuth, useState } from '#imports'

const { user, login, loginWithProvider, loggedIn } = useDirectusAuth()
const directus = useDirectus()

const form = reactive({
  email: 'admin@example.com',
  password: 'd1r3ctu5',
})

const redirectMode = ref<'default' | 'false' | 'custom'>('default')
const customRedirect = ref('/dashboard')

async function loginForm() {
  const redirect
    = redirectMode.value === 'false'
      ? false
      : redirectMode.value === 'custom'
        ? customRedirect.value
        : true

  await login(form.email, form.password, { redirect })
}

async function providerLogin(provider: string) {
  await loginWithProvider(provider)
}

const { data: ssoProviders } = await useAsyncData('ssoProviders', () =>
  directus.request(readProviders()))

const lastEvent = useState<{ user: any, firedAt: string } | null>('directus.lastLoginEvent')
</script>

<template>
  <div>
    <div v-if="!loggedIn">
      <h1>Login</h1>
      <p>Demonstrates <code>useDirectusAuth().login()</code> with redirect control.</p>

      <form @submit.prevent="loginForm">
        <label for="email-input">
          Email
          <input
            id="email-input"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
          >
        </label>
        <label for="password-input">
          Password
          <input
            id="password-input"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
          >
        </label>

        <label>
          Redirect after login
          <select v-model="redirectMode">
            <option value="default">Default (home from config)</option>
            <option value="false">false - stay on this page</option>
            <option value="custom">Custom path</option>
          </select>
        </label>

        <label v-if="redirectMode === 'custom'">
          Custom path
          <input v-model="customRedirect" type="text" placeholder="/dashboard">
        </label>

        <button type="submit">
          Login
        </button>
      </form>

      <div class="demo-section">
        <h2>Login with Providers - <code>loginWithProvider()</code></h2>
        <p v-if="!ssoProviders?.length" class="note">
          No SSO providers are configured.
          The <code>directus-template-cli</code> <code>cms</code> example template does not include any SSO providers by default.
          To test <code>loginWithProvider()</code>, add an OAuth provider in your Directus instance under Settings → Authentication.
        </p>
        <div v-for="provider in ssoProviders" :key="provider.name">
          <button @click="providerLogin(provider.name)">
            Log in with {{ provider.name }}
          </button>
        </div>
      </div>
    </div>

    <div v-else>
      <h1>Logged in</h1>
      <p>You're logged in as:</p>
      <pre>{{ JSON.stringify(user, null, 2) }}</pre>
      <NuxtLink to="/auth/logout">
        Logout
      </NuxtLink>
    </div>

    <div class="demo-section">
      <h2>Hook - <code>directus:loggedIn</code></h2>
      <p>
        Fired by the module plugin on every page load when a session exists, and after a successful login.
        See <code>plugins/auth-events.client.ts</code> in this playground for the listener.
      </p>
      <pre v-if="lastEvent">{{ JSON.stringify(lastEvent, null, 2) }}</pre>
      <p v-else class="note">
        Not yet fired this session.
      </p>
    </div>
  </div>
</template>
