import { defineNuxtRouteMiddleware } from '#imports'

export default defineNuxtRouteMiddleware(() => {
  // Allow access without authentication
  // This middleware is used to mark pages as public when global auth is enabled
})
