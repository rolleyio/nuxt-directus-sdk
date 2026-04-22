<script setup lang="ts">
// TODO: Add call to Directus to see if it's active & using template cms
// TODO: Add indicator to user that they are or are not in an iframe.
</script>

<template>
  <div>
    <h1>nuxt-directus-sdk Playground</h1>
    <p>
      Interactive examples for every composable and function exported by this module.
      Use the sidebar to navigate between demos.
    </p>

    <h2>Auth</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/auth/login">
          Login
        </NuxtLink> - <code>login()</code>, <code>loginWithProvider()</code>, redirect options, <code>directus:loggedIn</code> hook
      </li>
      <li>
        <NuxtLink to="/auth/register">
          Register
        </NuxtLink> - <code>register()</code>
      </li>
      <li>
        <NuxtLink to="/auth/password">
          Password Reset
        </NuxtLink> - <code>passwordRequest()</code>, <code>passwordReset()</code>
      </li>
      <li>
        <NuxtLink to="/auth/profile">
          Profile
        </NuxtLink> - <code>readMe()</code>, <code>updateMe()</code>, <code>useDirectusUser()</code>
      </li>
      <li>
        <NuxtLink to="/dashboard">
          Dashboard
        </NuxtLink> - <code>auth</code> middleware
      </li>
      <li>
        <NuxtLink to="/auth/middleware">
          Middleware
        </NuxtLink> - <code>guest</code> middleware, <code>enableGlobalAuthMiddleware</code>, <code>directus:loggedIn</code> hook
      </li>
    </ul>

    <h2>Data</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/blog">
          Blog
        </NuxtLink> - <code>useDirectus()</code> + <code>readItems()</code> with filter &amp; sort
      </li>
      <li>
        <NuxtLink to="/data/singleton">
          Singleton
        </NuxtLink> - <code>readSingleton()</code>
      </li>
    </ul>

    <h2>Visual Editor</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/visual-editor">
          Visual Editor Demo
        </NuxtLink> - <code>DirectusVisualEditor</code>, <code>DirectusEditButton</code>, <code>DirectusAddButton</code>, setup instructions
      </li>
      <li>
        <NuxtLink to="/blog">
          Blog list
        </NuxtLink> → click any post - <code>DirectusVisualEditor</code> field wrappers on the post page
      </li>
    </ul>

    <h2>Files</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/files">
          Upload & URL
        </NuxtLink> - <code>uploadDirectusFile()</code>, <code>uploadDirectusFiles()</code>, <code>getDirectusFileUrl()</code>
      </li>
    </ul>

    <h2>Server-side</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/server">
          Server Composables
        </NuxtLink> -
        <code>useAdminDirectus()</code>, <code>useSessionDirectus()</code>, <code>useTokenDirectus()</code>
      </li>
    </ul>

    <h2>Utilities</h2>
    <ul class="demo-list">
      <li>
        <NuxtLink to="/utils">
          URL & State
        </NuxtLink> - <code>useDirectusUrl()</code>, <code>useDirectusOriginUrl()</code>, <code>useDirectusPreview()</code>, <code>useDirectusVisualEditor()</code>
      </li>
    </ul>
  </div>
</template>
