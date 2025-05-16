<template>
  <div class="example">
    <div v-bind="$attrs" class="showcase">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.example {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.showcase {
  padding: 8px;
  margin: 0.5px;
}
</style>
