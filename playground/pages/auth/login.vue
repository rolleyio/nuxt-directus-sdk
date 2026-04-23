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

const redirectOptions = [
  { label: 'Default (home from config)', value: 'default' },
  { label: 'false - stay on this page', value: 'false' },
  { label: 'Custom path', value: 'custom' },
]

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

// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastEvent = useState<{ user: any, firedAt: string } | null>('directus.lastLoginEvent')
</script>

<template>
  <div class="space-y-8">
    <div v-if="!loggedIn">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">
          Login
        </h1>
        <p class="text-muted">
          Demonstrates <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusAuth().login()</code> with redirect control.
        </p>
      </div>

      <UForm
        :state="form"
        class="space-y-4 max-w-sm"
        @submit="loginForm"
      >
        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Password"
          name="password"
          required
        >
          <UInput
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Redirect after login"
          name="redirect"
        >
          <USelect
            v-model="redirectMode"
            :items="redirectOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="redirectMode === 'custom'"
          label="Custom path"
          name="customRedirect"
        >
          <UInput
            v-model="customRedirect"
            placeholder="/dashboard"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
        >
          Login
        </UButton>
      </UForm>

      <div class="mt-8 pt-6 border-t border-default">
        <h2 class="text-base font-semibold mb-2">
          Login with Providers - <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">loginWithProvider()</code>
        </h2>
        <ConfigNotice v-if="!ssoProviders?.length">
          No SSO providers are configured.
          The <code>directus-template-cli</code> <code>cms</code> example template does not include any SSO providers by default.
          To test <code>loginWithProvider()</code>, add an OAuth provider in your Directus instance under Settings → Authentication.
        </ConfigNotice>
        <div class="flex flex-col gap-2">
          <UButton
            v-for="provider in ssoProviders"
            :key="provider.name"
            color="neutral"
            variant="outline"
            class="w-fit"
            @click="providerLogin(provider.name)"
          >
            Log in with {{ provider.name }}
          </UButton>
        </div>
      </div>
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-2">
        Logged in
      </h1>
      <p class="text-muted mb-3">
        You're logged in as:
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-3">{{ JSON.stringify(user, null, 2) }}</pre>
      <UButton
        to="/auth/logout"
        color="neutral"
        variant="soft"
      >
        Logout
      </UButton>
    </div>

    <div class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Hook - <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">directus:loggedIn</code>
      </h2>
      <p class="text-muted text-sm mb-3">
        Fired by the module plugin on every page load when a session exists, and after a successful login.
        See <code class="text-xs bg-elevated px-1 py-0.5 rounded">plugins/auth-events.client.ts</code> in this playground for the listener.
      </p>
      <pre
        v-if="lastEvent"
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto"
      >{{ JSON.stringify(lastEvent, null, 2) }}</pre>
      <p
        v-else
        class="text-xs text-muted italic border-l-2 border-default pl-3"
      >
        Not yet fired this session.
      </p>
    </div>
  </div>
</template>
