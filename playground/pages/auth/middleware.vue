<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: ['guest'],
})

</script>

<template>
  <div>
    <h1>Middleware</h1>
    <p>
      Demonstrates the <code>guest</code> middleware and explains
      <code>enableGlobalAuthMiddleware</code>.
    </p>

    <div class="demo-section">
      <h2><code>guest</code> middleware</h2>
      <p>
        This page declares <code>definePageMeta({ middleware: 'guest' })</code>.
        The <code>guest</code> middleware is a no-op by itself - it exists as an
        explicit opt-out marker for when <code>enableGlobalAuthMiddleware</code> is
        enabled.
      </p>
      <p>
        When <code>enableGlobalAuthMiddleware: true</code> is set in
        <code>nuxt.config.ts</code>, every route requires authentication by default.
        Marking a page with <code>guest</code> exempts it from that check, keeping
        it publicly accessible.
      </p>
      <pre>// nuxt.config.ts
directus: {
  auth: {
    enableGlobalAuthMiddleware: true, // protect all routes
  },
}

// any public page
definePageMeta({ middleware: 'guest' })</pre>
      <p class="note">
        This playground has <code>enableGlobalAuthMiddleware: false</code> (the default), so
        <code>guest</code> is declared here for demonstration purposes only - it has no
        effect in the current configuration.
      </p>
    </div>

    <div class="demo-section">
      <h2><code>auth</code> middleware</h2>
      <p>
        The inverse: add <code>middleware: 'auth'</code> to any page to protect it
        individually. The <a href="/dashboard">Dashboard</a> page in this playground
        uses this pattern. When a logged-out user visits it they are redirected to
        <code>/auth/login?redirect=/dashboard</code> and returned after login.
      </p>
    </div>
  </div>
</template>
