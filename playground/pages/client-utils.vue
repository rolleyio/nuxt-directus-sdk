<script setup lang="ts">
import { computed, ref, useDirectusOriginUrl, useDirectusPreview, useDirectusUrl, useDirectusVisualEditor } from '#imports'

const pathInput = ref('items/posts')

const resolvedUrl = computed(() => useDirectusUrl(pathInput.value))
const resolvedOriginUrl = computed(() => useDirectusOriginUrl(pathInput.value))

const preview = useDirectusPreview()
const visualEditor = useDirectusVisualEditor()
</script>

<template>
  <div>
    <h1>Client Utilities</h1>
    <p>Demonstrates the URL and state composables available in every page and component.</p>

    <div class="demo-section">
      <h2><code>useDirectusUrl(path?)</code></h2>
      <p>
        Returns the context-aware Directus base URL. On the client it uses the configured URL (or <code>devProxy</code> path in development).
        On the server it prefers <code>serverDirectusUrl</code> for internal networking (Docker/K8s), falling back to the client URL.
      </p>
      <label>
        Path
        <input v-model="pathInput" type="text" placeholder="items/posts">
      </label>
      <div class="url-result">
        <p class="url-label">
          Resolved URL:
        </p>
        <code class="url">{{ resolvedUrl }}</code>
      </div>
    </div>

    <div class="demo-section">
      <h2><code>useDirectusOriginUrl(path?)</code></h2>
      <p>
        Always returns the real public-facing Directus URL, ignoring both <code>devProxy</code> and <code>serverDirectusUrl</code>.
        Use this for SSO redirects and admin links that must point to the actual Directus origin.
      </p>
      <div class="url-result">
        <p class="url-label">
          Resolved origin URL (same path as above):
        </p>
        <code class="url">{{ resolvedOriginUrl }}</code>
      </div>
      <p class="note">
        In local development with <code>devProxy</code> enabled, <code>useDirectusUrl()</code> returns the proxy path while <code>useDirectusOriginUrl()</code> returns the real Directus URL.
        In production without a proxy they will be the same.
      </p>
    </div>

    <div class="demo-section">
      <h2><code>useDirectusPreview()</code></h2>
      <p>
        A <code>{{ `Ref\<boolean\>` }}</code> that is <code>true</code> when the page was loaded
        with <code>?preview=true</code> in the URL. Set automatically by the module plugin —
        use it to show draft/unpublished content.
      </p>
      <p>Current value: <strong>{{ preview }}</strong></p>
      <p class="note">
        Add <code>?preview=true</code> to the current URL to activate preview mode, then
        reload. The plugin also looks for a <code>?token=</code> param and sets it on the
        Directus client so draft content requests are authenticated.
      </p>
    </div>

    <div class="demo-section">
      <h2><code>useDirectusVisualEditor()</code></h2>
      <p>
        A <code>{{ `Ref\<boolean\>` }}</code> that is <code>true</code> when the page is loaded
        inside a Directus iframe (the visual editor). Set automatically — use it to
        conditionally render editing UI.
      </p>
      <p>Current value: <strong>{{ visualEditor }}</strong></p>
      <div class="config-notice config-notice--nuxt">
        <span class="config-notice-badge">nuxt.config.ts</span>
        This will be <code>true</code> only when your site is embedded inside the Directus
        admin panel via the Visual Editor module. Requires
        <code>visualEditor: true</code> in your module config (already enabled in this
        playground's <code>nuxt.config.ts</code>).
      </div>
    </div>
  </div>
</template>
