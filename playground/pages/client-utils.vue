<script setup lang="ts">
import { computed, ref, useDirectusOriginUrl, useDirectusPreview, useDirectusUrl, useDirectusVisualEditor } from '#imports'

const pathInput = ref('items/posts')

const resolvedUrl = computed(() => useDirectusUrl(pathInput.value))
const resolvedOriginUrl = computed(() => useDirectusOriginUrl(pathInput.value))

const preview = useDirectusPreview()
const visualEditor = useDirectusVisualEditor()
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Client Utilities
      </h1>
      <p class="text-muted">
        Demonstrates the URL and state composables available in every page and component.
      </p>
    </div>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusUrl(path?)</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Returns the context-aware Directus base URL. On the client it uses the configured URL (or <code class="text-xs bg-elevated px-1 py-0.5 rounded">devProxy</code> path in development).
        On the server it prefers <code class="text-xs bg-elevated px-1 py-0.5 rounded">serverDirectusUrl</code> for internal networking (Docker/K8s), falling back to the client URL.
      </p>
      <UFormField
        label="Path"
        class="max-w-sm mb-3"
      >
        <UInput
          v-model="pathInput"
          placeholder="items/posts"
          class="w-full"
        />
      </UFormField>
      <p class="text-sm font-semibold mb-1">
        Resolved URL:
      </p>
      <code class="block bg-elevated border border-default rounded p-3 text-xs wrap-break-word">{{ resolvedUrl }}</code>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusOriginUrl(path?)</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Always returns the real public-facing Directus URL, ignoring both <code class="text-xs bg-elevated px-1 py-0.5 rounded">devProxy</code> and <code class="text-xs bg-elevated px-1 py-0.5 rounded">serverDirectusUrl</code>.
        Use this for SSO redirects and admin links that must point to the actual Directus origin.
      </p>
      <p class="text-sm font-semibold mb-1">
        Resolved origin URL (same path as above):
      </p>
      <code class="block bg-elevated border border-default rounded p-3 text-xs wrap-break-word mb-3">{{ resolvedOriginUrl }}</code>
      <p class="text-xs text-muted italic border-l-2 border-default pl-3">
        In local development with <code>devProxy</code> enabled, <code>useDirectusUrl()</code> returns the proxy path while <code>useDirectusOriginUrl()</code> returns the real Directus URL.
        In production without a proxy they will be the same.
      </p>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusPreview()</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        A <code class="text-xs bg-elevated px-1 py-0.5 rounded">Ref&lt;boolean&gt;</code> that is <code class="text-xs bg-elevated px-1 py-0.5 rounded">true</code> when the page was loaded
        with <code class="text-xs bg-elevated px-1 py-0.5 rounded">?preview=true</code> in the URL. Set automatically by the module plugin —
        use it to show draft/unpublished content.
      </p>
      <p class="text-sm mb-3">
        Current value: <UBadge
          :color="preview ? 'success' : 'neutral'"
          variant="soft"
        >
          {{ preview }}
        </UBadge>
      </p>
      <p class="text-xs text-muted italic border-l-2 border-default pl-3">
        Add <code>?preview=true</code> to the current URL to activate preview mode, then
        reload. The plugin also looks for a <code>?token=</code> param and sets it on the
        Directus client so draft content requests are authenticated.
      </p>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusVisualEditor()</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        A <code class="text-xs bg-elevated px-1 py-0.5 rounded">Ref&lt;boolean&gt;</code> that is <code class="text-xs bg-elevated px-1 py-0.5 rounded">true</code> when the page is loaded
        inside a Directus iframe (the visual editor). Set automatically — use it to
        conditionally render editing UI.
      </p>
      <p class="text-sm mb-3">
        Current value: <UBadge
          :color="visualEditor ? 'success' : 'neutral'"
          variant="soft"
        >
          {{ visualEditor }}
        </UBadge>
      </p>
      <ConfigNotice source="nuxt">
        This will be <code>true</code> only when your site is embedded inside the Directus
        admin panel via the Visual Editor module. Requires
        <code>visualEditor: true</code> in your module config (already enabled in this
        playground's <code>nuxt.config.ts</code>).
      </ConfigNotice>
    </section>
  </div>
</template>
