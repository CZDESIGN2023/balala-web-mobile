import { ref } from 'vue'
import router from '@/router'
import { Local } from '@/utils/storage'

export function useGetThirdToken() {
  const im_token = ref('')
  if (router.currentRoute.value.query.im_token) {
    im_token.value = router.currentRoute.value.query.im_token as string
  }
  else if (router.currentRoute.value.query.nextPath) {
    const url = new URL(router.currentRoute.value.query.nextPath as string, window.location.origin)
    im_token.value = url.searchParams.get('im_token') as string
  }
  if (im_token.value) {
    Local.set('im_token', im_token.value)
  }
  return {
    im_token,
  }
}
