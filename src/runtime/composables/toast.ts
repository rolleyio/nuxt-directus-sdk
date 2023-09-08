import { useToast as useToastFn } from 'vue-toastification'

export function useToast() {
  const toast = useToastFn()

  async function log(message: string) {
    if (process.client)
      toast(message)
    else
      // eslint-disable-next-line no-console
      console.log(message)
  }

  async function success(message: string, options?: Parameters<typeof toast.success>[1]) {
    if (process.client)
      toast.success(message, options)
    else
      // eslint-disable-next-line no-console
      console.log('success', message)
  }

  async function info(message: string, options?: Parameters<typeof toast.info>[1]) {
    if (process.client)
      toast.info(message, options)
    else
      // eslint-disable-next-line no-console
      console.info(message)
  }

  async function warn(message: string, options?: Parameters<typeof toast.warning>[1]) {
    if (process.client)
      toast.warning(message, options)
    else
      console.warn(message)
  }

  async function error(message = 'Something has gone wrong, please try again later.', options?: Parameters<typeof toast.error>[1]) {
    if (process.client)
      toast.error(message, options)
    else
      console.error(message)
  }

  return {
    log,
    success,
    info,
    warn,
    error,
  }
}
