<script lang="ts" setup>
import { definePageMeta, useDirectus, useDirectusAuth, useRouter } from '#imports'
import { readItem, readMe, readUser } from '@directus/sdk'

definePageMeta({
  middleware: ['auth'],
})

const { user, logout } = useDirectusAuth()
const directus = useDirectus()

async function testing() {
  const _test = await directus.request(readItem('blogs', '', {
    fields: ['id', { author: ['*'] }],
  }))

  // test.organization?.owner?.auth_data

  const _user = await directus.request(readUser('', {
    fields: ['id', { avatar: ['id'] }, { }],
  }))

  // const test = await directus.auth.refresh()
  // console.log(test)
}

async function testGet() {
  const _test = await directus.request(readMe())
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
