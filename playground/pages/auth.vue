<script lang="ts" setup>
import { readItem, readMe, readUser } from '@directus/sdk'
import { definePageMeta, useDirectus, useDirectusAuth, useRouter } from '#imports'

definePageMeta({
  middleware: ['auth'],
})

const { user, logout } = useDirectusAuth()
const directus = useDirectus()

async function testing() {
  const test = await directus.request(readItem('cards', '', {
    fields: ['id', { from: [{ avatar: ['id'] }] }],
  }))

  const user = await directus.request(readUser('', {
    fields: ['id', { avatar: ['id'] }],
  }))

  // const test = await directus.auth.refresh()
  // console.log(test)
}

async function testGet() {
  const test = await directus.request(readMe())
  // console.log(test)
}

async function logoutSystem() {
  await logout()
  useRouter().push('/')
}
</script>

<template>
  <div>
    <p>{{ user }}</p>

    <button @click="testing">
      Test Refresh
    </button>

    <button @click="testGet">
      Test Get
    </button>

    <button @click="logoutSystem">
      Logout
    </button>
  </div>
</template>
