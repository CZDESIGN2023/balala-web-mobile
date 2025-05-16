<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'
import router from '@/router'
import { getMemberListByFilter, getMemberListInfo } from '@/api/project'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  spaceId: '',
  currentLabel: '', // 替换当前用户 label 为 currentLabel值
  creator: false, // 在选项中增加 任务创建人选项
  creator2user: false, // 将 _creator 转换为当前用户信息
})

const emit = defineEmits(['update:value', 'change'])

interface Props {
  value: string[]
  spaceId?: string
  currentLabel?: string
  creator?: boolean
  creator2user?: boolean
}

const { userInfo } = useUserStore()
const projectStore = useProjectStore()
const bFormPersonSelectRef = ref()
let options: any[] = []
const creatorItem = { label: '任务创建人', value: '_creator', description: '', avatar: 'default-avatar' }

const modelValue = ref([]) as Ref<any[]>
watch(() => props.value, () => {
  modelValue.value = props.value.map(item => ({ value: item, label: '', avatar: '' }))
  const r: any[] = []
  const ajax: string[] = []
  props.value.forEach((item) => {
    const option = options.find((ele) => {
      return ele.value === item
    })
    if (option) {
      r.push(option)
    }
    else if (item === '_creator') {
      if (props.creator) {
        r.push(creatorItem)
      }
      else {
        r.push({ label: userInfo.userNickname, value: userInfo.id, avatar: userInfo.avatar })
      }
    }
    else {
      r.push(item)
      ajax.push(item)
    }
  })
  if (ajax.length > 0) {
    getMemberListInfo({ spaceIds: [], userIds: ajax }).then(({ data }) => {
      data.list.forEach((item: any) => {
        const index = r.indexOf(item.userId)
        if (index > -1) {
          r.splice(index, 1, {
            value: item.userId,
            // 替换当前用户昵称
            label: userInfo.id === item.userId && props.currentLabel || item.userNickname,
            avatar: (userInfo.id === item.userId && props.currentLabel) ? 'default-avatar' : item.avatar,
            description: item.userName,
          })
        }
      })
      modelValue.value = r
    })
  }
  else {
    modelValue.value = r
  }
}, { immediate: true })

// Options 列表
async function onQueryOptions() {
  try {
    const spaceId = props.spaceId || router.currentRoute.value.params.id as string
    const spaceIds: string[] = spaceId && spaceId !== '0' ? `${spaceId}`.split(',') : projectStore.projectList.map((item: any) => item.id)
    const { data } = await getMemberListByFilter({ spaceIds })
    const filterList = data.list.map((item: any) => ({
      value: item.userId,
      label: item.userNickname,
      avatar: item.avatar,
      description: item.userName,
    }))

    // 如果当前用户不在列表首位，将其移动到首位
    const currentUserItem = filterList.find(item => item.value === userInfo.id)
    if (currentUserItem) {
      // 替换当前用户昵称
      if (props.currentLabel) {
        currentUserItem.label = props.currentLabel
        currentUserItem.avatar = 'default-avatar'
      }
      const index = filterList.indexOf(currentUserItem)
      if (index > -1) {
        filterList.splice(index, 1)
        filterList.unshift(currentUserItem)
      }
    }
    if (props.creator) {
      filterList.unshift(creatorItem)
    }
    options = filterList || []
    return filterList || []
  }
  catch (error) {
    console.error('Error fetching person list:', error)
    return []
  }
}

function updateVal(val: string[]) {
  emit('update:value', val.map((item: any) => item.value), options)
}

function onChange(val: { add: any[], remove: any[] }, selected: any[]) {
  emit('change', {
    add: val.add.map(item => item.value),
    remove: val.remove.map(item => item.value),
  }, selected.map((item: any) => item.value))
}

function open() {
  bFormPersonSelectRef.value.open()
}

defineExpose({ open })
</script>

<template>
  <BFormPersonSelect
    ref="bFormPersonSelectRef"
    v-bind="$attrs"
    :value="modelValue"
    :query-options="onQueryOptions"
    @update:value="updateVal"
    @change="onChange"
  />
</template>
