<script lang="ts" setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import filterItem from './item.vue'
import filterShift from './shift.vue'
import type {
  ConditionGroup,
  QueryConditionGroup,
} from './interface'
import { configFilterTag } from './index'
import { formatConditionData, getConditionsCount, getFirstValidConditionOfGroup, parseToUIData } from '@/mixins/condition'
import { getElementOrParentWithClass } from '@/utils/dom'
import { useProjectStore } from '@/stores/modules/project'
import router from '@/router'
import { getFilterTag } from '@/api/project'

defineOptions({ name: 'BSearchFilter' })

const props = withDefaults(defineProps<Props>(), {
  isProject: false,
})

const emits = defineEmits(['onChange'])

interface Props {
  isProject?: boolean
}

const workbenchTabkey: any = inject('workbenchTabkey', '')

const projectStore = useProjectStore()

const filterItemRef = ref()
const filterShiftGroup = ref()
const filterPopup = ref()
const filterWrapperRef = ref()

const visible = ref<boolean>(false)
const conditionData = ref<ConditionGroup>({
  conjunction: 'AND',
  conditions: [],
  conditionGroup: [],
})

const state = reactive({
  conditionTagActive: '',
  filterShowText: '',
  filterContentWidth: 628,
})

const cacheKey = computed(() => `project_list_${props.isProject ? workbenchTabkey.value : router.currentRoute.value.params.id}`)

const judegConditionStyle = computed(() => {
  return !conditionData.value.conditions.length && (conditionData.value.conditionGroup ? conditionData.value.conditionGroup.length <= 1 : true)
})

const homeFilterText = computed(() => {
  return projectStore.getFilterData(cacheKey.value)?.text || ''
})

// 获取筛选条件文案
async function getFilterText(data: any) {
  const countData = getConditionsCount(data)
  if (countData.conditionCount === 0) {
    return ''
  }
  else if (countData.conditionCount === 1) {
    const obj = await getFirstValidConditionOfGroup(data)
    return obj?.filterText as string
  }
  else {
    return `筛选·${countData.conditionCount}`
  }
}

// 重置视图
function clearOption() {
  projectStore.setFilterData(cacheKey.value, [] as any, [] as any, '')
  conditionData.value = {
    conjunction: 'AND',
    conditions: [],
    conditionGroup: [],
  }
  clearFilterTagActive()
}

// 获取本地存储的筛选条件
function getFilterStoreData() {
  if (conditionData.value.conditions.length || conditionData.value.conditionGroup?.length) {
    return
  }

  const storeData = projectStore.getFilterData(cacheKey.value)

  if (!storeData || (!getConditionsCount(storeData.data).conditionCount && !getConditionsCount(storeData.data).groupsCount)) {
    // 工作台 && 没有自定义的筛选组 需要默认填充一个空的筛选条件
    if (props.isProject && !configFilterTag.value.length) {
      conditionData.value = {
        conjunction: 'AND',
        conditions: [
          {
            oneSelectVal: null,
            twoOptions: [],
            twoSelectVal: null,
            thirdSelectVal: [],
            isOpen: true,
          },
        ],
        conditionGroup: [],
      }
    }
    else {
      conditionData.value = {
        conjunction: 'AND',
        conditions: [],
        conditionGroup: [],
      }
    }

    return
  }
  if (!storeData.text)
    return

  conditionData.value = storeData.data
  updateTableData(conditionData.value, false)
}

function renderData(postData: QueryConditionGroup) {
  const renderData = parseToUIData(postData)
  conditionData.value = renderData

  if (!renderData || (!getConditionsCount(renderData).conditionCount && !getConditionsCount(renderData).groupsCount)) {
    conditionData.value = {
      conjunction: 'AND',
      conditions: [],
      conditionGroup: [],
    }
  }
  clearFilterTagActive()
  updateTableData(renderData)
}

// 设置本地筛选数据
async function setFilterData(renderData: ConditionGroup, postData: QueryConditionGroup) {
  const texts = await getFilterText(renderData) || ''
  projectStore.setFilterData(cacheKey.value, renderData, postData, texts)
}

// 筛选数据发生变化
function onChangeFilterData(renderData: ConditionGroup, isCloseFilter: boolean = false, isClearFilterTag: boolean = false) {
  if (isClearFilterTag) {
    clearFilterTagActive()
  }
  conditionData.value = renderData
  updateTableData(conditionData.value)
  if (!renderData || (!getConditionsCount(renderData).conditionCount && !getConditionsCount(renderData).groupsCount) && isCloseFilter) {
    visible.value = false
  }
}

async function updateTableData(renderData: ConditionGroup, isChange: boolean = true) {
  const postData = formatConditionData(renderData)
  await setFilterData(renderData, postData)
  emits('onChange', renderData, isChange)
}

function getFilterContentWidth() {
  requestAnimationFrame(() => {
    const filterWrapper = filterWrapperRef.value
    let width = filterWrapper ? filterWrapper.clientWidth : 0

    if (width < 600)
      width = 628

    state.filterContentWidth = width
  })
}

// 清除筛选组id
function clearFilterTagActive() {
  if (filterShiftGroup.value) {
    filterShiftGroup.value && filterShiftGroup.value.clearConditionTagActive()
  }
  else {
    const key = `condition_${props.isProject ? workbenchTabkey.value : router.currentRoute.value.params.id}`
    projectStore.setProjectFilterTagId(key, '')
  }
}

// 获取筛选组数据
async function getFilterTagData() {
  const key = `condition_${props.isProject ? workbenchTabkey.value : router.currentRoute.value.params.id}`
  const res = await getFilterTag([key])
  try {
    configFilterTag.value = JSON.parse(res.data[key]) || []
  }
  catch (error) {
    console.log('error', error)
    configFilterTag.value = []
  }
}

async function updateOpen(filterPopupShow: boolean) {
  if (filterPopupShow) {
    configFilterTag.value = []
    await getFilterTagData()
    getFilterStoreData()
  }
  // else {
  //   setTimeout(() => {
  //     configFilterTag.value = []
  //   }, 100)
  // }
}

// 当筛选项发生改变时, 重置筛选组宽度
watch(() => conditionData, () => {
  getFilterContentWidth()
}, { deep: true })

// 处理筛选组点击删除会关闭筛选弹窗
onClickOutside(filterPopup, (event: Event) => {
  const target = event.target as unknown as HTMLModElement
  const isModal = getElementOrParentWithClass(target, 'ant-modal')
  const isDrop = getElementOrParentWithClass(target, 'ant-popover')
  const isTooltip = getElementOrParentWithClass(target, 'ant-tooltip')
  if (isModal || isDrop || isTooltip) {
    return
  }
  if (visible.value)
    visible.value = false
})

defineExpose({
  clearOption,
  renderData,
})
</script>

<template>
  <a-popover
    :open="visible"
    placement="bottomLeft"
    :align="{ offset: [0, -4] }"
    trigger="click"
    :destroy-tooltip-on-hide="false"
    overlay-class-name="pop-order project-filter-popover-box-shadow filter-sort-style"
    @open-change="updateOpen"
  >
    <template #content>
      <div ref="filterPopup" class="filter-container">
        <div class="order-title pfm color-title line14 mb16">
          快速筛选
        </div>
        <filter-shift
          ref="filterShiftGroup"
          :is-project="isProject"
          :width="state.filterContentWidth"
          @on-change-filter-data="onChangeFilterData"
        />
        <div ref="filterWrapperRef" class="filter-wrapper" :class="{ 'filter-no-condition': judegConditionStyle }">
          <filter-item
            ref="filterItemRef"
            :data="conditionData"
            :is-project="isProject"
            @on-change-filter-data="onChangeFilterData"
          />
        </div>
      </div>
    </template>
    <!-- 单条件单选 -->
    <div class="item flex-row-center" :class="homeFilterText && 'active'" @click="visible = !visible">
      <svg-icon name="filter" size="14" />
      <p class="name ml4 text14 flex-one ss-line-1" :class="{ pr0: homeFilterText }">
        <!-- {{ homeFilterText || '筛选' }} -->
        筛选
      </p>
    </div>
  </a-popover>
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
      width: 64px;
      height: 32px;
      border-radius: 4px;
      padding: 8px;
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
  width: 100%;
  align-self: flex-start;
}
.pop-order .order-ul {
  margin: 0 !important;
}
</style>
