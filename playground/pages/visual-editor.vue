<script setup lang="ts">
import { readItems, useAsyncData, useDirectus, useDirectusPreview, useDirectusVisualEditor } from '#imports'

const directus = useDirectus()
const visualEditor = useDirectusVisualEditor()
const preview = useDirectusPreview()

const { data: post } = await useAsyncData('ve-post', () =>
  directus.request(
    readItems('posts', {
      limit: 1,
      fields: ['id', 'title', 'slug', 'content', 'image', 'published_at', { author: ['id', 'first_name', 'last_name'] }],
      sort: '-published_at',
    }),
  ), { transform: data => data[0] })
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Visual Editor
      </h1>
      <p class="text-muted">
        Demonstrates <code class="text-xs bg-elevated px-1 py-0.5 rounded">DirectusVisualEditor</code> (component) and <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusVisualEditor()</code> (composable).
        Both only activate when your site is loaded inside the Directus admin iframe; for normal visitors they render as transparent pass-throughs.
      </p>
    </div>

    <UAlert
      :color="visualEditor ? 'success' : 'warning'"
      variant="subtle"
      :icon="visualEditor ? 'i-lucide-check-circle' : 'i-lucide-triangle-alert'"
      :title="visualEditor ? 'Visual editor: Active' : 'Visual editor: Not detected'"
      :description="visualEditor
        ? 'You are running inside the Directus admin iframe.'
        : 'To demo these features, open this page inside the Directus Visual Editor.'"
    />
    <UAlert
      v-if="preview"
      color="info"
      variant="subtle"
      icon="i-lucide-eye"
      title="Preview mode active"
      description="Showing draft content"
    />

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-3">
        Setup
      </h2>
      <ConfigNotice title="Directus Config Required">
        Two places need to be configured in your Directus instance:
        <ol class="list-decimal pl-6 space-y-1 mt-2">
          <li>
            <strong>Collection preview URL</strong> In the <code>posts</code> collection settings, set the Preview URL to <code>http://localhost:3000/blog/<span v-pre>{{slug}}</span>?visual-editing=true</code>.
            Directus substitutes <code><span v-pre>{{slug}}</span></code> with the item's actual value when you open the visual editor for a specific post.
          </li>
          <li>
            <strong>Live Preview sidebar URLs</strong> In <em>Settings → Live Preview</em>, add
            <code>http://localhost:3000/blog?visual-editing=true</code> (and this page's URL) for the
            preview sidebar that appears while editing.
          </li>
        </ol>
      </ConfigNotice>
      <p class="text-xs text-muted italic border-l-2 border-default pl-3">
        Add <code>?debug</code> to the URL to see connection logs in the browser console.
        The module detects the visual editor purely by iframe context (<code>window.parent !== window</code>) - the <code>?visual-editing=true</code> query param is informational only.
      </p>
    </section>

    <section
      v-if="post"
      class="pt-6 border-t border-default"
    >
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">DirectusVisualEditor</code> - field-level wrappers
      </h2>
      <p class="text-sm text-muted mb-4">
        Each wrapper adds a <code class="text-xs bg-elevated px-1 py-0.5 rounded">data-directus</code> attribute pointing to the collection,
        item ID, and optional field(s). Clicking a wrapped element inside the Directus iframe
        opens the editor for that specific field.
      </p>

      <UCard
        class="mb-4"
        :ui="{ body: 'p-0 sm:p-0' }"
      >
        <DirectusVisualEditor
          collection="posts"
          :item="post.id"
          fields="image"
          mode="drawer"
        >
          <NuxtImg
            v-if="post.image"
            provider="directus"
            :src="post.image"
            width="800"
            height="300"
            fit="cover"
            alt="Post image"
            class="w-full h-50 object-cover block"
          />
          <div
            v-else
            class="bg-elevated h-30 flex items-center justify-center text-muted text-sm italic"
          >
            No image - click to add one (inside Directus iframe)
          </div>
        </DirectusVisualEditor>

        <div class="p-4 space-y-2">
          <DirectusVisualEditor
            collection="posts"
            :item="post.id"
            fields="title"
            mode="popover"
          >
            <h2 class="text-xl font-semibold">
              {{ post.title }}
            </h2>
          </DirectusVisualEditor>

          <DirectusVisualEditor
            v-if="post.author && typeof post.author === 'object'"
            collection="directus_users"
            :item="(post.author as any).id"
            :fields="['first_name', 'last_name']"
            mode="modal"
          >
            <p class="text-xs text-muted">
              By {{ (post.author as any).first_name }} {{ (post.author as any).last_name }} {{ post.published_at }}
            </p>
          </DirectusVisualEditor>

          <DirectusVisualEditor
            collection="posts"
            :item="post.id"
            fields="content"
          >
            <pre class="text-sm whitespace-pre-wrap wrap-break-word">{{ post.content }}</pre>
          </DirectusVisualEditor>
        </div>
      </UCard>

      <p class="text-xs text-muted italic border-l-2 border-default pl-3 mb-3">
        <strong>mode</strong> prop variants used above: <code>drawer</code> (image, content), <code>popover</code> (title), <code>modal</code> (author).
        All three open in Directus after clicking the wrapped element inside the iframe.
      </p>

      <p class="text-sm text-muted">
        The same <code class="text-xs bg-elevated px-1 py-0.5 rounded">DirectusVisualEditor</code> wrappers are used on the individual blog post page.
        When loaded inside the Directus visual editor iframe, all fields become clickable edit targets.
      </p>
      <UButton
        v-if="post?.slug"
        :to="`/blog/${post.slug}`"
        color="primary"
        variant="link"
        :padded="false"
        class="mt-2"
        trailing-icon="i-lucide-arrow-right"
      >
        See it in action on this blog post
      </UButton>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        <code class="text-xs bg-elevated px-1.5 py-0.5 rounded">useDirectusVisualEditor()</code> composable
      </h2>
      <p class="text-sm text-muted mb-3">
        <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusVisualEditor()</code> returns a <code class="text-xs bg-elevated px-1 py-0.5 rounded">Ref&lt;boolean&gt;</code> that is <code class="text-xs bg-elevated px-1 py-0.5 rounded">true</code>
        when the page is running inside the Directus admin iframe. It is the same reactive value the
        <code class="text-xs bg-elevated px-1 py-0.5 rounded">DirectusVisualEditor</code> component uses internally.
      </p>
      <p class="text-sm text-muted mb-3">
        Use it directly when you need custom behavior beyond a field wrapper: conditionally rendering a
        toolbar, lazy-loading editing scripts, or applying editor-only styles.
      </p>

      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-3">const visualEditor = useDirectusVisualEditor()

// Drive any conditional logic from this boolean:
// v-if="visualEditor"       only visible inside the Directus iframe
// :class="{ 'edit-mode': visualEditor }"  apply editor styles</pre>

      <p class="text-sm text-muted mb-4">
        <strong>Difference from <code class="text-xs bg-elevated px-1 py-0.5 rounded">DirectusVisualEditor</code>:</strong>
        the component wraps an element and adds <code class="text-xs bg-elevated px-1 py-0.5 rounded">data-directus</code> attributes so Directus knows
        which collection/item/field to open when clicked. The composable gives you the raw boolean for
        anything the wrapper component does not cover.
      </p>

      <UAlert
        v-if="visualEditor"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle"
      >
        <template #description>
          Visual editor is active. This paragraph is only rendered inside the Directus iframe
          (<code>useDirectusVisualEditor()</code> is <code>true</code>).
        </template>
      </UAlert>
      <UAlert
        v-else
        color="neutral"
        variant="soft"
        icon="i-lucide-info"
      >
        <template #description>
          Visual editor is not active (<code>useDirectusVisualEditor()</code> is <code>false</code>).
          Load this URL inside Directus Live Preview to see the above message appear.
        </template>
      </UAlert>
    </section>
  </div>
</template>
