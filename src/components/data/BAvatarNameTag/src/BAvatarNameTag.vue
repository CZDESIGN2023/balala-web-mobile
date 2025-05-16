<!-- 头像+昵称 标签 -->
<script setup lang="ts">
defineOptions({ name: 'BAvatarNameTag' })

withDefaults(defineProps<Props>(), {
  // 用户id
  userId: '',
  // 昵称
  userNickname: '',
  // 头像图片地址
  src: '',
  closable: false,
  onlyAvatar: false,
  showAll: false,
})

defineEmits(['close'])

interface Props {
  userId?: string
  userNickname?: string
  maxWidth?: number
  src?: string
  closable?: boolean
  onlyAvatar?: boolean
  showAll?: boolean
}
</script>

<template>
  <div
    :class="{ pr8: !onlyAvatar }"
    class="director-box br20 h28 flex-row-start title-color"
  >
    <b-head :id="userId" :class="{ mr4: !onlyAvatar }" :name="userNickname" :src="src" width="6.15385vw" />

    <template v-if="!onlyAvatar">
      <div class="text14 icon-color" :class="{ nickname: !showAll }">
        <span>{{ userNickname }}</span>
      </div>
      <div :style="{ width: closable ? '12px' : '0', opacity: closable ? 1 : 0, pointerEvents: closable ? 'all' : 'none' }" class="close-container">
        <svg-icon name="close2" size="12" class="close pointer" @click.stop="$emit('close')" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.director-box {
  min-width: 0;
  max-width: 100%;
  border: 1px solid #f2f3f5;
  display: inline-flex;
  background: #fff;
  height: 26px;
  vertical-align: bottom;
  .avatar {
    background: #fff;
    color: #fff;
    flex-shrink: 0;
  }
}
.nickname {
  max-width: 58px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.svg-icon {
  :deep(use) {
    fill: #999;
  }
  &:hover {
    :deep(use) {
      fill: #666;
    }
  }
}
.close-container {
  margin-left: 4px;
  margin-right: -4px;
  width: 12px;
  height: 12px;
  transition: 0.2s;
  position: relative;
  .close {
    position: absolute;
  }
}
</style>
