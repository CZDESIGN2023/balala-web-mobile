import VueCropper from './vue-cropper.vue'

const install = function (Vue: any) {
  Vue.component('VueCropper', VueCropper)
}

/* istanbul ignore if */
if (typeof window !== 'undefined' && (window as any).Vue)
  install((window as any).Vue)

export { VueCropper }

export default {
  version: '0.6.5',
  install,
  VueCropper,
  vueCropper: VueCropper,
}
