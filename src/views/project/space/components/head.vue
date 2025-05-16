<script lang="ts" setup>
interface Props {
  title: string
  icon?: string
  total: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  total: 0,
})
</script>

<template>
  <div class="module-head flex-row-between mt12 mb2">
    <div class="left flex-row-start">
      <b-icon v-if="props.icon" class="mr6" :name="props.icon" size="16" color="#999999" />
      <p class="h16 text14 text-gray-800 pfm font-smoothing flex-row-start">
        {{ props.title }} <span v-if="props.total" class="total ml6 text12 minor-color">共 {{ props.total }}</span>
      </p>
      <slot name="leftTool" />
    </div>
    <div class="right flex-row-start gap8">
      <slot name="rightTool" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .module-head {
  height: 32px;
}
</style>
