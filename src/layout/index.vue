<script lang="ts" setup>
import sideBar from './sidebar/index.vue'
import appMain from './main/index.vue'
</script>

<template>
  <div class="app-layout">
    <sideBar />
    <app-main />
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  width: 100%;
  height: 100%;
}

.slide-left-enter-active {
  transition: all 0.3s;
}

.slide-left-leave-active {
  transition: all 0.3s;
}

.slide-left-enter-from {
  opacity: 0;
}

.slide-left-enter-to {
  opacity: 1;
}

.slide-left-leave-from {
  opacity: 1;
  overflow: hidden;
  white-space: nowrap;
}

.slide-left-leave-to {
  width: $sidebar-width-is-collapse;
  overflow: hidden;
  white-space: nowrap;
}

.slide-right-enter-active {
  transition: all 0.3s;
}

.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  width: $sidebar-width-is-collapse;
  overflow: hidden;
  white-space: nowrap;
}

.slide-right-enter-to {
  width: $sidebar-width;
  overflow: hidden;
  white-space: nowrap;
}

.slide-right-leave-from {
  opacity: 1;
}

.slide-right-leave-to {
  opacity: 0;
}
</style>
