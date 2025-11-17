<script lang="ts" setup>
	import { reactive, useDirectusAuth } from '#imports'

	const { user, login, loggedIn } = useDirectusAuth()

	const form = reactive({
		email: 'admin@example.com',
		password: 'd1r3ctu5',
	})

	async function loginForm() {
		await login(form.email, form.password)
	}
</script>

<template>
	<div>
		<form
			v-if="!loggedIn"
			@submit.prevent="loginForm">
			<div>
				<label for="email-input">Email</label>
				<input
					id="email-input"
					v-model="form.email"
					type="email"
					autocomplete="email"
					required />
			</div>

			<div>
				<label for="password-input">Password</label>
				<input
					id="password-input"
					v-model="form.password"
					type="password"
					autocomplete="current-password"
					required />
			</div>

			<button>Submit</button>
		</form>

		<div v-else>
			<p>You're logged in as:</p>
			<pre>{{ user }}</pre>
			<NuxtLink to="/auth/logout"> Click to Logout </NuxtLink>
		</div>
	</div>
</template>
