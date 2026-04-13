---
outline: deep
---

# Authentication Composables

<!-- eslint-disable-next-line markdown/heading-increment -->
### `useDirectusAuth()`

Main authentication composable with methods and state for user authentication.

**Returns:** `DirectusAuth`

```typescript
interface DirectusAuth {
  user: Ref<DirectusUsers | null>
  loggedIn: ComputedRef<boolean>
  readMe: () => Promise<DirectusUsers | null>
  updateMe: (data: Partial<DirectusUsers>) => Promise<DirectusUsers | null>
  login: (email: string, password: string, options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }) => Promise<DirectusUsers | null>
  loginWithProvider: (provider: string, redirectOnLogin?: boolean | string) => Promise<void>
  logout: (redirect?: boolean | RouteLocationRaw) => Promise<void>
  createUser: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  register: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  inviteUser: (email: string, role: string, inviteUrl?: string) => Promise<void>
  acceptUserInvite: (token: string, password: string) => Promise<void>
  passwordRequest: (email: string, resetUrl?: string) => Promise<void>
  passwordReset: (token: string, password: string) => Promise<void>
}
```
**Example:**

```typescript
const {
  user,
  loggedIn,
  login,
  logout,
  readMe,
  updateMe,
} = useDirectusAuth()

// Login
await login('user@example.com', 'password')

// Check if logged in
if (loggedIn.value) {
  console.log('Logged in as:', user.value.email)
}

// Update user
await updateMe({ first_name: 'John' })

// Logout
await logout()
```

#### Properties

##### `user`

- **Type:** `Ref<DirectusUsers | null>`
- **Description:** Current authenticated user

```typescript
const { user } = useDirectusAuth()

console.log(user.value?.email)
console.log(user.value?.first_name)
console.log(user.value?.role)
```

##### `loggedIn`

- **Type:** `ComputedRef<boolean>`
- **Description:** Whether a user is currently logged in

```typescript
const { loggedIn } = useDirectusAuth()

if (loggedIn.value) {
  console.log('User is authenticated')
}
```

#### Methods

##### `readMe()`

Fetch the current user's data.

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { readMe } = useDirectusAuth()

const user = await readMe()
```

##### `updateMe(data)`

Update the current user's profile.

**Parameters:**
- `data: Partial<DirectusUsers>` - Fields to update

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { updateMe } = useDirectusAuth()

await updateMe({
  first_name: 'John',
  last_name: 'Doe',
  avatar: 'file-uuid',
})
```

##### `login(email, password, options?)`

Login with email and password.

**Parameters:**
- `email: string` - User email
- `password: string` - User password
- `options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }` - Login options

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { login } = useDirectusAuth()

// Login with redirect (default)
await login('user@example.com', 'password')

// Login without redirect
await login('user@example.com', 'password', { redirect: false })

// Login with custom redirect
await login('user@example.com', 'password', { redirect: '/dashboard' })

// Login with OTP
await login('user@example.com', 'password', { otp: '123456' })
```

##### `loginWithProvider(provider, redirectOnLogin?)`

Login with SSO/OAuth provider. Note that a redirect is required for SSO authentication, so if you are passing `false` to redirectOnLogin your browser will still redirect, but you will be redirected to the current page.

**Parameters:**
- `provider: string` - Provider name (google, github, microsoft, etc.)
- `redirectOnLogin?: string | boolean` - URL to redirect to after login

**Returns:** `Promise<void>`

```typescript
const { loginWithProvider } = useDirectusAuth()

// Login with Google
await loginWithProvider('google')

// Login with custom redirect
await loginWithProvider('google', '/dashboard')

// Login with redirect as boolean
await loginWithProvider('google', false)
```

##### `logout(redirect?)`

Logout the current user.

**Parameters:**
- `redirect?: boolean | RouteLocationRaw` - Where to redirect after logout

**Returns:** `Promise<void>`

```typescript
const { logout } = useDirectusAuth()

// Logout with default redirect
await logout()

// Logout without redirect
await logout(false)

// Logout with custom redirect
await logout('/login')
```

##### `createUser(data)` / `register(data)`

Create a new user account. `register()` is an alias for `createUser()`.

**Parameters:**
- `data: Partial<DirectusUsers>` - User data

**Returns:** `Promise<DirectusUsers>`

```typescript
const { register } = useDirectusAuth()

const newUser = await register({
  email: 'new@example.com',
  password: 'secure-password',
  first_name: 'John',
  last_name: 'Doe',
})
```

##### `inviteUser(email, role, inviteUrl?)`

Invite a new user.

**Parameters:**
- `email: string` - User email
- `role: string` - Role ID or UUID
- `inviteUrl?: string` - Custom invite URL

**Returns:** `Promise<void>`

```typescript
const { inviteUser } = useDirectusAuth()

await inviteUser(
  'newuser@example.com',
  'role-uuid',
  'https://yourapp.com/accept-invite'
)
```

##### `acceptUserInvite(token, password)`

Accept a user invitation.

**Parameters:**
- `token: string` - Invite token
- `password: string` - New password

**Returns:** `Promise<void>`

```typescript
const { acceptUserInvite } = useDirectusAuth()

await acceptUserInvite('invite-token', 'new-password')
```

##### `passwordRequest(email, resetUrl?)`

Request a password reset.

**Parameters:**
- `email: string` - User email
- `resetUrl?: string` - Custom reset URL

**Returns:** `Promise<void>`

```typescript
const { passwordRequest } = useDirectusAuth()

await passwordRequest(
  'user@example.com',
  'https://yourapp.com/reset-password'
)
```

##### `passwordReset(token, password)`

Reset password with token.

**Parameters:**
- `token: string` - Reset token
- `password: string` - New password

**Returns:** `Promise<void>`

```typescript
const { passwordReset } = useDirectusAuth()

await passwordReset('reset-token', 'new-password')
```

---

### `useDirectusUser()`

Direct access to the current user state.

**Returns:** `Ref<DirectusUsers | null>`

```typescript
const user = useDirectusUser()

console.log(user.value?.email)
console.log(user.value?.first_name)

// Watch for changes
watch(user, (newUser) => {
  if (newUser) {
    console.log('User logged in:', newUser.email)
  }
  else {
    console.log('User logged out')
  }
})
```
