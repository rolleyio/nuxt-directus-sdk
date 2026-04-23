<script lang="ts" setup>
import { computed, useDirectusAuth } from '#imports'
import { useNav } from './composables/useNav'

const { user, loggedIn } = useDirectusAuth()
const nav = useNav()

const navItems = computed(() =>
  nav.map(group => ({
    label: group.label,
    type: 'label' as const,
    children: group.links.map(link => ({
      label: link.label,
      to: link.to,
      exact: link.to === '/',
    })),
  })),
)
</script>

<template>
  <UApp>
    <div class="grid grid-cols-[260px_1fr] min-h-screen">
      <aside class="sticky top-0 h-screen overflow-y-auto border-r border-default bg-elevated/40 p-4 flex flex-col gap-4">
        <div class="pb-3 border-b border-default">
          <p class="font-semibold text-sm">
            nuxt-directus-sdk
          </p>
          <div class="mt-2 text-xs text-muted">
            <template v-if="loggedIn">
              <p class="mb-1">
                Logged in as <span class="text-default">{{ user?.email }}</span>
              </p>
              <UButton
                to="/auth/logout"
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-log-out"
              >
                Logout
              </UButton>
            </template>
            <template v-else>
              <UButton
                to="/auth/login"
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-log-in"
              >
                Login
              </UButton>
            </template>
          </div>
        </div>

        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          variant="pill"
          class="flex-1"
        />
      </aside>

      <main class="p-8 max-w-4xl w-full">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
