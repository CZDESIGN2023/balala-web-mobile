<script setup lang="ts">
interface Props {
  loading: boolean
  heightClass: string
  mode?: 'default' | 'avatar'
}
withDefaults(defineProps<Props>(), {
  loading: false,
  heightClass: 'h24',
  mode: 'default',
})
</script>

<template>
  <div class="b-skeleton">
    <div v-if="loading" class="loading" :class="heightClass">
      <div v-if="mode === 'default'" class="default-box" />
      <div v-if="mode === 'avatar'" class="avatar-box">
        <div class="avatar" />
        <div class="content">
          <div class="head paragraph" />
          <div class="foot paragraph" />
        </div>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<style lang="scss" scoped>
.b-skeleton {
  width: 100%;
}
.loading {
  min-height: 24px;
  .default-box {
    height: 100%;
    background-color: #f7f8fa;
    border-radius: 4px;
    width: calc(100% - 24px);
    margin-left: 12px;
  }
  .avatar-box {
    width: 100%;
    height: 100%;
    display: flex;
    .avatar {
      width: 40px;
      height: 40px;
      background-color: #f7f8fa;
      border-radius: 50%;
      margin-right: 12px;
    }
    .content {
      flex: 1;
      .paragraph {
        width: 100%;
        border-radius: 4px;
        background: #f7f8fa;
      }
      .head {
        height: 96px;
      }
      .foot {
        height: 18px;
        margin-top: 8px;
      }
    }
  }
}
</style>
