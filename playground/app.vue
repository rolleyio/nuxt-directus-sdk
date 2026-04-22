<script lang="ts" setup>
import { useDirectusAuth } from '#imports'

const { user, loggedIn } = useDirectusAuth()

const nav = [
  {
    label: 'Overview',
    links: [
      { label: 'Home', to: '/' },
    ],
  },
  {
    label: 'Auth',
    links: [
      { label: 'Login', to: '/auth/login' },
      { label: 'Register', to: '/auth/register' },
      { label: 'Password Reset', to: '/auth/password' },
      { label: 'Profile (protected)', to: '/auth/profile' },
      { label: 'Dashboard (protected)', to: '/dashboard' },
      { label: 'Middleware', to: '/auth/middleware' },
    ],
  },
  {
    label: 'Data',
    links: [
      { label: 'Auto-Imports', to: '/data/auto-import' },
      { label: 'Blog (readItems)', to: '/blog' },
    ],
  },
  {
    label: 'Visual Editor',
    links: [
      { label: 'Visual Editor Demo', to: '/visual-editor' },
    ],
  },
  {
    label: 'Files',
    links: [
      { label: 'Upload & URL', to: '/files' },
    ],
  },
  {
    label: 'Server-side',
    links: [
      { label: 'Server Composables', to: '/server' },
    ],
  },
  {
    label: 'Utilities',
    links: [
      { label: 'URL & State', to: '/utils' },
    ],
  },
]
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <strong>nuxt-directus-sdk</strong>
        <div class="auth-status">
          <template v-if="loggedIn">
            Logged in as {{ user?.email }}<br>
            <NuxtLink to="/auth/logout">
              Logout
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login">
              Login
            </NuxtLink>
          </template>
        </div>
      </div>

      <nav>
        <div
          v-for="group in nav"
          :key="group.label"
          class="nav-group"
        >
          <p class="nav-group-label">
            {{ group.label }}
          </p>
          <ul>
            <li
              v-for="link in group.links"
              :key="link.to"
            >
              <NuxtLink :to="link.to" active-class="active">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <main class="content">
      <NuxtPage />
    </main>
  </div>
</template>
