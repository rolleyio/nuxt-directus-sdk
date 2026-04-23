<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: ['guest'],
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Middleware
      </h1>
      <p class="text-muted">
        Demonstrates the <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">guest</code> middleware and explains
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">enableGlobalAuthMiddleware</code>.
      </p>
    </div>

    <div class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">guest</code> middleware
      </h2>
      <p class="text-muted text-sm mb-3">
        This page declares <code class="text-xs bg-elevated px-1 py-0.5 rounded">definePageMeta({ middleware: 'guest' })</code>.
        The <code class="text-xs bg-elevated px-1 py-0.5 rounded">guest</code> middleware is a no-op by itself - it exists as an
        explicit opt-out marker for when <code class="text-xs bg-elevated px-1 py-0.5 rounded">enableGlobalAuthMiddleware</code> is
        enabled.
      </p>
      <p class="text-muted text-sm mb-3">
        When <code class="text-xs bg-elevated px-1 py-0.5 rounded">enableGlobalAuthMiddleware: true</code> is set in
        <code class="text-xs bg-elevated px-1 py-0.5 rounded">nuxt.config.ts</code>, every route requires authentication by default.
        Marking a page with <code class="text-xs bg-elevated px-1 py-0.5 rounded">guest</code> exempts it from that check, keeping
        it publicly accessible.
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-3">// nuxt.config.ts
directus: {
  auth: {
    enableGlobalAuthMiddleware: true, // protect all routes
  },
}

// any public page
definePageMeta({ middleware: 'guest' })</pre>
      <ConfigNotice source="nuxt">
        This playground has <code>enableGlobalAuthMiddleware: false</code> (the default), so
        <code>guest</code> is declared here for demonstration purposes only - it has no
        effect in the current configuration.
      </ConfigNotice>
    </div>

    <div class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">auth</code> middleware
      </h2>
      <p class="text-muted text-sm">
        The inverse: add <code class="text-xs bg-elevated px-1 py-0.5 rounded">middleware: 'auth'</code> to any page to protect it
        individually. The <NuxtLink
          to="/dashboard"
          class="text-primary hover:underline"
        >
          Dashboard
        </NuxtLink> page in this playground
        uses this pattern. When a logged-out user visits it they are redirected to
        <code class="text-xs bg-elevated px-1 py-0.5 rounded">/auth/login?redirect=/dashboard</code> and returned after login.
      </p>
    </div>
  </div>
</template>
