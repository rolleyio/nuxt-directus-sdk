<script lang="ts" setup>
import { reactive, useDirectusAuth } from '#imports'

const { user, login, loggedIn } = useDirectusAuth()

const form = reactive({
  email: '',
  password: '',
})

async function loginForm() {
  const _test = await login(form.email, form.password, { redirect: false })

  // console.log(test)
}
</script>

<template>
  <div>
    <p>{{ user }}</p>

    <form
      v-if="!loggedIn"
      class="space-y-3 mb-4"
      @submit.prevent="loginForm"
    >
      <div>
        <label
          class="label"
          for="email-input"
        >Email</label>
        <input
          id="email-input"
          v-model="form.email"
          type="email"
          class="text-black"
          autocomplete="email"
          required
        >
      </div>

      <div>
        <label
          class="label"
          for="password-input"
        >Password</label>
        <input
          id="password-input"
          v-model="form.password"
          type="password"
          class="text-black"
          autocomplete="current-password"
          required
        >
      </div>

      <button>Submit</button>
    </form>

    <p v-else>
      <NuxtLink to="/auth">
        Hello
      </NuxtLink>
    </p>
  </div>
</template>
