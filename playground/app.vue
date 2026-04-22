<script lang="ts" setup>
import { useDirectusAuth } from '#imports'
import { useNav } from './composables/useNav'

const { user, loggedIn } = useDirectusAuth()

const nav = useNav()
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
