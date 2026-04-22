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
      filter: { status: { _eq: 'published' } },
    }),
  ), { transform: data => data[0] })
</script>

<template>
  <div>
    <h1>Visual Editor</h1>
    <p>
      Demonstrates <code>DirectusVisualEditor</code>, <code>DirectusEditButton</code>, and <code>DirectusAddButton</code>.
      These components only activate when your site is loaded inside the Directus admin iframe (they render as pass-through wrappers for normal visitors).
    </p>

    <div class="ve-status" :class="visualEditor ? 've-status--active' : 've-status--inactive'">
      <strong>Visual editor:</strong>
      {{ visualEditor ? 'Active - inside Directus iframe' : 'Inactive - open this URL inside Directus Live Preview to activate' }}
    </div>

    <div v-if="preview" class="ve-banner">
      Preview mode active - showing draft content
    </div>

    <div class="demo-section">
      <h2>Setup</h2>
      <p>
        Two places need to be configured in Directus:
      </p>
      <ol style="margin: 0 0 12px 20px; color: #555; font-size: 13px; line-height: 2">
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
      <p class="note">
        Add <code>?debug</code> to the URL to see connection logs in the browser console.
        The module detects the visual editor purely by iframe context (<code>window.parent !== window</code>)
        - the <code>?visual-editing=true</code> query param is informational only.
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
      <h2>
        <code>DirectusEditButton</code>
        <span class="ve-status" :class="visualEditor ? 've-status--active' : 've-status--inactive'">
          <strong>Directus iFrame:</strong>
          {{ visualEditor ? 'Active' : 'Not Detected - To use this feature you must be in a Directus iFrame.' }}
        </span>
      </h2>
      <p>
        A floating button (fixed bottom-right) that opens the full item editor in Directus.
        Only rendered inside the iframe.
      </p>
      <p class="note">
        The DirectusEditButton slot has customized text passed to it in this example, refer to
        <NuxtLink v-if="post?.slug" :to="`/blog/${post.slug}`">
          the blog post shown above
        </NuxtLink>
        <NuxtLink v-else to="/blog">
          a blog post
        </NuxtLink>
        for the default slot example.
      </p>
      <DirectusEditButton
        v-if="post"
        collection="posts"
        :item="post?.id"
        mode="modal"
      >
        ⚙️ Customized Edit Button
      </DirectusEditButton>
    </div>

    <div class="demo-section">
      <h2>
        <code>DirectusAddButton</code>
        <span class="ve-status" :class="visualEditor ? 've-status--active' : 've-status--inactive'">
          <strong>Directus iFrame:</strong>
          {{ visualEditor ? 'Active' : 'Not Detected - To use this feature you must be in a Directus iFrame.' }}
        </span>
      </h2>
      <p>
        An button for adding items to a repeater or relationship field.
        Shown below is the <code>social_links</code> repeater on a parent
        <code>globals</code> singleton.
      </p>
      <DirectusAddButton
        collection="globals"
        item="ab89c489-faea-4310-8b59-7ddb3caf279a"
        field="social_links"
      />
      <p class="note">
        The <code>directus-template-cli</code> <code>cms</code> hardcoded for this example. If you are not using the template this will throw a 403 Forbidden Error.
      </p>
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
</style>
