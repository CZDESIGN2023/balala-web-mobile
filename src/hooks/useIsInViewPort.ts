import { type Ref, onMounted, onUnmounted, ref } from 'vue'

interface UseIsInViewPortOptions {
  threshold?: number | number[]
  rootMargin?: string
}

export function useIsInViewPort(
  target: Ref<HTMLElement | null>,
  { threshold = 0, rootMargin = '0px' }: UseIsInViewPortOptions = {},
) {
  const isIntersecting = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (target.value) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting.value = entry.isIntersecting
        },
        {
          threshold,
          rootMargin,
        },
      )

      observer.observe(target.value)
    }
  })

  onUnmounted(() => {
    if (observer && target.value) {
      observer.unobserve(target.value)
      observer = null
    }
  })

  return isIntersecting
}
