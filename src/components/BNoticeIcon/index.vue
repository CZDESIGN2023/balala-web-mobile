<script lang="ts" setup>
import { getAssetsFile } from '@/utils'

interface Props {
  src?: string
  custom?: string
}

withDefaults(defineProps<Props>(), {
  src: '',
  custom: '',
})
</script>

<template>
  <div class="b-notice-icon w32 h32 br16">
    <img v-if="src" class="w32 h32 br16" :src="getAssetsFile(src, custom)">
  </div>
</template>

<style lang="scss" scoped></style>
