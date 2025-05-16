<script setup lang="ts">
import { computed, inject, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import type { ConditionGroup } from './interface'
import { filterTag } from './config'
import { configFilterTag } from './index'
import { getAllUncompletedTasks, getOwnerTasks, getWeekCompletedTask, getWeekUncompletedTasks } from '@/mixins/condition'
import router from '@/router'
import { getTextLength } from '@/utils'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'
import { setFilterTag } from '@/api/project'
import { Msgbox } from '@/utils/msgbox'

interface Props {
  isProject?: boolean
  width: number
}

const props = withDefaults(defineProps<Props>(), {
  isProject: false,
  width: 628,
})

const emits = defineEmits(['onChangeFilterData'])

const workbenchTabkey: any = inject('workbenchTabkey', '')

const projectStore = useProjectStore()
const { userInfo } = useUserStore()

const tagInputRef = ref()

const editOldName = ref<string>('')
const conditionData = ref<ConditionGroup>({
  conjunction: 'AND',
  conditions: [],
  conditionGroup: [],
})

const state = reactive({
  conditionTagActive: '',
  isEditTag: false, // 为了在筛选组编辑状态下隐藏其他筛选组的下拉操作
})

const filterDataKey = computed(() => {
  const workTab = projectStore.getHomeTabData()
  const key = `condition_${props.isProject ? workTab : router.currentRoute.value.params.id}`
  return key
})

const cacheKey = computed(() => `project_list_${props.isProject ? workbenchTabkey.value : router.currentRoute.value.params.id}`)

const defaultFilterTag = computed(() => {
  if (props.isProject) {
    return []
  }
  else {
    return filterTag
  }
})

const filterTagLen = computed(() => {
  return configFilterTag.value.length + defaultFilterTag.value.length
})

// 获取当前筛选id
function getProjectFilterTagId() {
  state.conditionTagActive = projectStore.getProjectFilterTagId(filterDataKey.value)
}

// 设置当前缓存的筛选组id
function setProjectFilterTagId(value: string) {
  state.conditionTagActive = value
  projectStore.setProjectFilterTagId(filterDataKey.value, value)
}

async function handleDelFilterTag(item: any) {
  try {
    Msgbox.error.m({ title: '确认删除此筛选组', zIndex: 2000 }).then(async () => {
      const { id: tagId } = item

      configFilterTag.value = configFilterTag.value.filter(tag => tag.id !== tagId)

      const conditionFilterObj = {
        [filterDataKey.value]: JSON.stringify(configFilterTag.value),
      }

      await setFilterTag(conditionFilterObj)
      message.success('筛选组删除成功', 3)
    })
  }
  catch (error) {}
}

function handleEditFilterTag(index: number) {
  configFilterTag.value[index].isEdit = true
  setTimeout(() => {
    tagInputRef.value && tagInputRef.value[0].focus()
  }, 30)
}

// 标签聚焦
function editFilterFocus(item: any) {
  state.isEditTag = true
  editOldName.value = item.name
}
// 标签离焦
async function editFilterBlur(item: any, index: number) {
  state.isEditTag = false
  configFilterTag.value[index].isEdit = false

  const MIN_LENGTH = 2
  const MAX_LENGTH = 30
  const length = getTextLength(item.name)

  if (!item.name || length < MIN_LENGTH || length > MAX_LENGTH) {
    message.error(`请输入${MIN_LENGTH} ~ ${MAX_LENGTH} 个字符`, 3)
    item.name = editOldName.value
    return
  }

  if (item.name === editOldName.value) {
    return
  }

  const conditionFilterObj = {
    [filterDataKey.value]: JSON.stringify(configFilterTag.value),
  }

  try {
    await setFilterTag(conditionFilterObj)
    message.success('条件名称修改成功', 3)
  }
  catch (error) {
    item.name = editOldName.value
  }
}

function editFilterEnter() {
  tagInputRef.value && tagInputRef.value[0].blur()
}

// 使用默认筛选组数据
async function handleFilterData(item: any) {
  if (state.conditionTagActive === item.id) {
    return
  }

  const isProject = props.isProject
  const actions = {
    1: getAllUncompletedTasks,
    2: getWeekCompletedTask,
    3: () => {
      const data = getOwnerTasks(isProject)
      data.conditions[0].thirdSelectVal = [userInfo.id]
      return data
    },
    4: getWeekUncompletedTasks,
  }

  const action = actions[item.id as keyof typeof actions]

  if (action) {
    try {
      const updatedConditionData = action(isProject)
      conditionData.value = updatedConditionData
      setProjectFilterTagId(item.id)
      emits('onChangeFilterData', conditionData.value)
    }
    catch (error) {}
  }
}
// 使用筛选组数据
async function handleStorageFilterData(item: any, index: number) {
  if (configFilterTag.value[index].isEdit || state.conditionTagActive === item.id) {
    return
  }
  const copyConfig = cloneDeep(configFilterTag.value)

  const copyCondition = copyConfig[index].conditionData

  setProjectFilterTagId(item.id)
  conditionData.value = copyCondition

  emits('onChangeFilterData', conditionData.value)
}

function clearConditionTagActive() {
  state.conditionTagActive = ''
  setProjectFilterTagId('')
}

// 监听工作台切换
watch(cacheKey, () => {
  setTimeout(() => {
    getProjectFilterTagId()
  }, 100)
})

onMounted(() => {
  getProjectFilterTagId()
})

defineExpose({
  clearConditionTagActive,
})
</script>

<template>
  <div class="filter-tag-scroll" :class="{ 'no-filter-tag': !filterTagLen }">
    <div class="filter-tag" :style="{ width: `${width}px` }">
      <div v-for="(item, index) in configFilterTag" :key="item.id" class="tag-item" :class="{ 'input-focus': item.isEdit, 'active': item.id === state.conditionTagActive }" @click="handleStorageFilterData(item, index)">
        <a-popover
          :overlay-class-name="`filter-drop-down-control-box ${state.isEditTag ? 'filter-tag-drop-edit' : ''}`"
          trigger="hover"
          :align="{ offset: [0, -8] }"
          placement="bottomLeft"
        >
          <template #content>
            <div class="filter-tag-control">
              <svg-icon
                class="tag-edit-icon pointer"
                name="edit-tag"
                size="12"
                color="#666666"
                @click="handleEditFilterTag(index)"
              />
              <svg-icon
                class="tag-delete-icon pointer"
                name="delete-tag"
                size="12"
                color="#666666"
                @click="handleDelFilterTag(item)"
              />
            </div>
          </template>
          <div class="tag-input">
            <div v-if="!item.isEdit" class="edit-tag-item">
              {{ item.name }}
            </div>
            <a-input
              v-else
              ref="tagInputRef"
              v-model:value="item.name"
              v-autowidth
              class="edit-tag-input"
              :bordered="false"
              @focus="editFilterFocus(item)"
              @blur="editFilterBlur(item, index)"
              @press-enter="editFilterEnter()"
            />
          </div>
        </a-popover>
      </div>
      <div v-for="(item) in defaultFilterTag" :key="item.id" class="tag-item" :class="{ active: item.id === state.conditionTagActive }" @click="handleFilterData(item)">
        <div class="edit-tag-item">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.filter-tag-drop-edit {
  .ant-popover-content {
    opacity: 0;
    display: none;
  }
}
.filter-drop-down-control-box {
  .ant-popover-content {
    .ant-popover-inner {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      padding: 6px;
      background: #fff;
      border: 1px solid $tool-drop-box-border;
      box-shadow: $tool-drop-box-shadow;
      position: relative;
      .filter-tag-control {
        display: flex;
        justify-content: space-between;
      }
      &:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1px;
        height: 14px;
        background-color: $color-border-main;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.filter-container {
  display: flex;
  flex-direction: column;
}
.filter-wrapper {
  align-self: flex-start;
}
.pop-order .order-ul {
  margin: 0 !important;
}
.filter-tag-scroll {
  padding-bottom: 4px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
  display: flex;
  flex-wrap: wrap;
  &.no-filter-tag {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: 1px solid transparent;
  }
}
.filter-tag {
  display: flex;
  flex-wrap: wrap;
  .tag-item {
    margin-right: 8px;
    margin-bottom: 8px;
    font-size: $filter-drop-font-size;
    line-height: 1;
    color: #1a1a1a;
    box-sizing: border-box;
    cursor: pointer;
    .tag-input {
      height: 100%;
      input {
        width: 100% !important;
        height: 100%;
        border: 2px solid transparent;
        font-size: $filter-drop-font-size;
        &:focus {
          border: 2px solid $color-primary;
        }
      }
    }
    &.active {
      .edit-tag-item {
        color: $color-primary;
        padding: 5px 8px;
        border: 1px solid transparent;
        background-color: $tool-select-bg;
      }
    }
    .edit-tag-item {
      font-size: 12px;
      padding: 5px 8px;
      border: 1px solid $color-border-main;
      border-radius: 4px;
      // &:hover {
      //   padding: 5px 8px;
      //   border: 1px solid transparent;
      //   background-color: $tool-hover-bg;
      // }
      &:active {
        padding: 5px 8px;
        background-color: $tool-click-bg;
        border: 1px solid transparent;
      }
      .edit-tag-input {
        outline: none;
      }
    }
    &.input-focus {
      width: 50px;
      height: 23px;
      padding: 0;
      border: none;
      &.active {
        padding: 0;
        border: none;
        background: none;
      }
      &:hover {
        background: none;
        padding: 0;
        border: none;
      }
      &:active {
        background: none;
        padding: 0;
        border: none;
      }
    }
  }
}
</style>
