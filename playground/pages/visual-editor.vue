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
  <div>
    <h1>Visual Editor</h1>
    <p>
      Demonstrates <code>DirectusVisualEditor</code>(component) and <code>useDirectusVisualEditor()</code>(composable).
      Both only activate when your site is loaded inside the Directus admin iframe; for normal visitors they render as transparent pass-throughs.
    </p>

    <div class="ve-status" :class="visualEditor ? 've-status--active' : 've-status--inactive'">
      <strong>Visual editor:</strong>
      {{ visualEditor
        ? 'Active. You are running inside the Directus admin iframe.'
        : 'Not detected. To demo these features, open this page inside the Directus Visual Editor.'
      }}
    </div>
    <div v-if="preview" class="ve-banner">
      Preview mode active - showing draft content
    </div>

    <div class="demo-section">
      <h2>Setup</h2>
      <div class="config-notice config-notice--directus">
        <span class="config-notice-badge">
          <img src="~/assets/directus-logo.svg" width="12" height="12" alt="">
          Directus Config Required
        </span>
        Two places need to be configured in your Directus instance:
        <ol style="margin: 4px 0 0 20px; font-size: 13px; line-height: 2">
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
      </div>
      <p class="note">
        Add <code>?debug</code> to the URL to see connection logs in the browser console.
        The module detects the visual editor purely by iframe context (<code>window.parent !== window</code>) - the <code>?visual-editing=true</code> query param is informational only.
      </p>
    </div>

    <div v-if="post" class="demo-section">
      <h2><code>DirectusVisualEditor</code> - field-level wrappers</h2>
      <p>
        Each wrapper adds a <code>data-directus</code> attribute pointing to the collection,
        item ID, and optional field(s). Clicking a wrapped element inside the Directus iframe
        opens the editor for that specific field.
      </p>

      <div class="ve-post">
        <!-- Image - single field, drawer mode -->
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
            class="ve-post-image"
          />
          <div v-else class="ve-post-image-placeholder">
            No image - click to add one (inside Directus iframe)
          </div>
        </DirectusVisualEditor>

        <!-- Title - single field, popover mode -->
        <DirectusVisualEditor
          collection="posts"
          :item="post.id"
          fields="title"
          mode="popover"
        >
          <h2 class="ve-post-title">
            {{ post.title }}
          </h2>
        </DirectusVisualEditor>

        <!-- Author - related collection, multiple fields, modal mode -->
        <DirectusVisualEditor
          v-if="post.author && typeof post.author === 'object'"
          collection="directus_users"
          :item="(post.author as any).id"
          :fields="['first_name', 'last_name']"
          mode="modal"
        >
          <p class="ve-post-meta">
            By {{ (post.author as any).first_name }} {{ (post.author as any).last_name }} {{ post.published_at }}
          </p>
        </DirectusVisualEditor>

        <!-- Content - single field, drawer mode (default) -->
        <DirectusVisualEditor
          collection="posts"
          :item="post.id"
          fields="content"
        >
          <div class="ve-post-content">
            <pre>{{ post.content }}</pre>
          </div>
        </DirectusVisualEditor>
      </div>

      <p class="note">
        <strong>mode</strong> prop variants used above: <code>drawer</code> (image, content), <code>popover</code> (title), <code>modal</code> (author).
        All three open in Directus after clicking the wrapped element inside the iframe.
      </p>

      <p>
        The same <code>DirectusVisualEditor</code> wrappers are used on the individual blog post page.
        When loaded inside the Directus visual editor iframe, all fields become clickable edit targets.
      </p>
      <NuxtLink v-if="post?.slug" :to="`/blog/${post.slug}`">
        See it in action on this blog post
      </NuxtLink>
    </div>

    <div class="demo-section">
      <h2><code>useDirectusVisualEditor()</code> composable</h2>
      <p>
        <code>useDirectusVisualEditor()</code> returns a <code>Ref&lt;boolean&gt;</code> that is <code>true</code>
        when the page is running inside the Directus admin iframe. It is the same reactive value the
        <code>DirectusVisualEditor</code> component uses internally.
      </p>
      <p>
        Use it directly when you need custom behavior beyond a field wrapper: conditionally rendering a
        toolbar, lazy-loading editing scripts, or applying editor-only styles.
      </p>

      <pre>
const visualEditor = useDirectusVisualEditor()

// Drive any conditional logic from this boolean:
// v-if="visualEditor"       only visible inside the Directus iframe
// :class="{ 'edit-mode': visualEditor }"  apply editor styles</pre>

      <p>
        <strong>Difference from <code>DirectusVisualEditor</code>:</strong>
        the component wraps an element and adds <code>data-directus</code> attributes so Directus knows
        which collection/item/field to open when clicked. The composable gives you the raw boolean for
        anything the wrapper component does not cover.
      </p>

      <div class="ve-composable-demo">
        <p v-if="visualEditor" class="ve-composable-active">
          Visual editor is active. This paragraph is only rendered inside the Directus iframe
          (<code>useDirectusVisualEditor()</code> is <code>true</code>).
        </p>
        <p v-else class="ve-composable-inactive">
          Visual editor is not active (<code>useDirectusVisualEditor()</code> is <code>false</code>).
          Load this URL inside Directus Live Preview to see the above message appear.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.ve-status {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin: 20px 10px;
}

.ve-status--active {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.ve-status--inactive {
  background: #fff8e1;
  color: #f57f17;
  border: 1px solid #ffe082;
}

.ve-banner {
  background: #ede7f6;
  color: #4527a0;
  border: 1px solid #b39ddb;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

.ve-post {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.ve-post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.ve-post-image-placeholder {
  background: #f5f5f5;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 13px;
  font-style: italic;
}

.ve-post-title {
  margin: 16px 16px 4px;
  font-size: 20px;
}

.ve-post-meta {
  margin: 0 16px 12px;
  font-size: 12px;
  color: #777;
}

.ve-post-content {
  padding: 0 16px 16px;
  font-size: 13px;
}

.ve-post-content pre {
  border: none;
  padding: 0;
  background: transparent;
  white-space: pre-wrap;
}

.ve-composable-demo {
  margin-top: 12px;
}

.ve-composable-active {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin: 0;
}

.ve-composable-inactive {
  background: #f5f5f5;
  color: #777;
  border: 1px solid #e0e0e0;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin: 0;
  font-style: italic;
}
</style>
