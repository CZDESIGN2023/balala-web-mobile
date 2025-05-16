<!-- BHead -->
<!-- 头像 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { randomColor, stringSub } from '@/utils'
import { SpaceRole } from '@/enum'
import { SvgIcon } from '@/components/SvgIcon'
import defaultAvatar from '@/assets/icon/default-avatar.png'

const props = withDefaults(defineProps<Props>(), {
  width: '32px',
  // 字号
  fs: 'text12',
  name: '',
  src: '',
  id: '',
  roleId: 0,
  // 是否为用户组
  isGroup: false,
})
const userStore = useUserStore()
const configAvatar = userStore.config.filter(item => item.configKey === 'user.avatar.domain')[0]
  .configValue

interface Props {
  width?: string
  fs?: string
  name?: string
  src?: string
  id?: string
  roleId?: number
  isGroup?: boolean
}

const calcPermissionBg = computed(() => {
  switch (props.roleId) {
    case SpaceRole.CREATOR:
      return { backgroundColor: '#FF9800' }
    case SpaceRole.SUPER_MANAGER:
      return { backgroundColor: '#1D74F5' }
    default:
      return { }
  }
})

const showPermissionIcon = computed(() => {
  return props.roleId === SpaceRole.CREATOR || props.roleId === SpaceRole.SUPER_MANAGER
})

const iconName = computed(() => {
  return props.roleId === SpaceRole.CREATOR ? 'head_star' : 'head_setting'
})

const srcUrl = computed(() => {
  if (props.src.startsWith('http')) {
    return props.src
  }
  else if (props.src === 'default-avatar') {
    return defaultAvatar
  }
  return configAvatar + props.src
})
</script>

<template>
  <div
    class="avatar flex-row-center pointer"
    :style="{ width, height: width, background: src ? '' : randomColor(id) }"
  >
    <div class="avatar-box flex-row-center">
      <img v-if="src" :src="srcUrl" alt="">
      <SvgIcon v-else-if="isGroup" name="user-group" size="16" color="#FFFFFF" />
      <span v-else :class="fs">{{ stringSub(name) || '' }}</span>
    </div>
    <div v-if="showPermissionIcon" class="avatar-permission" :style="calcPermissionBg">
      <SvgIcon :name="iconName" size="7" color="#FFFFFF" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.avatar {
  color: #ffffff;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  box-shadow: $tool-drop-box-shadow;
  justify-content: center;
  border: 0;
  position: relative;
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: absolute;
    top: 0;
  }
  .creator-img {
    width: 14px;
    height: 14px;
    position: absolute;
    bottom: 0px;
    right: 0px;
    top: auto;
    z-index: 1;
    min-height: auto;
  }
  .manager-img {
    width: 14px;
    height: 14px;
    position: absolute;
    bottom: 0px;
    right: 0;
    top: auto;
    min-height: auto;
  }
  .avatar-permission {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 14px;
    height: 14px;
    border: 1px solid #fff;
    background: blue;
    border-radius: 50%;
    // display: flex;
    // align-items: center;
    // justify-content: center;
    svg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

.avatar-box {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    text-align: center;
    font-style: normal;
  }
}
</style>
