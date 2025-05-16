<script lang="ts" setup>
import { nextTick, reactive, ref, shallowReactive, toRaw, watch } from 'vue'
import draggable from 'vuedraggable'
import type { GroupOneOptions, GroupSelectOptions } from './interface'
import { useProjectStore } from '@/stores/modules/project'

defineOptions({ name: 'SearchGroup' })

const props = withDefaults(defineProps<Props>(), {
  isProject: false,
})
const emits = defineEmits<{
  /**
   * 更新数据
   * @param val 选择项集合
   */
  change: [
    val: any[],
    isChange: boolean,
  ]
}>()

interface Props {
  isProject?: boolean
}
// 深层响应集合
interface TSOrderRt {
  optionSelect: GroupSelectOptions[]
}

// 浅层响应集合
interface TSOrderSRt {
  // 第一个的剩余下拉集合
  oneOverList: GroupOneOptions[]
}

// 分组最多层级
const groupLevel = 3
const grabbing = ref(false)

const orderSRt = shallowReactive<TSOrderSRt>({
  oneOverList: [],
})

const orderRt = reactive<TSOrderRt>({
  optionSelect: [],
})

const oneOptions: GroupOneOptions[] = [
  {
    value: 'space_id',
    label: '项目',
    icon: 'filter-project',
  },
  {
    value: 'work_object_id',
    label: '所属模块',
    icon: 'filter-module',
  },
  {
    value: 'priority',
    label: '优先级',
    icon: 'filter-priority',
  },
  {
    value: 'work_item_status',
    label: '任务状态',
    icon: 'filter-status',
  },
  {
    value: 'work_item_flow_id',
    label: '任务流程',
    icon: 'filter-type',
  },
  {
    value: 'version_id',
    label: '版本规划',
    icon: 'version-black',
  },
  {
    value: 'directors',
    label: '当前负责人',
    icon: 'filter-creator',
  },
  {
    value: 'user_id',
    label: '创建人',
    icon: 'filter-creator',
  },
]

if (!props.isProject)
  oneOptions.splice(0, 1)

const projectStore = useProjectStore()

// 筛选框文字
const filterText = ref<string>('')
const visible = ref<boolean>(false)

// 初始化 剩余下拉集合
orderSRt.oneOverList = [...oneOptions]

/**
 * 分组-更新数据
 */
function updateData(isChange: boolean = true) {
  const fOptions = [...toRaw(orderRt.optionSelect)]

  const nOptions = fOptions.filter(item => item.oneSelectVal)

  if (nOptions.length === 0) {
    filterText.value = ''
  }
  else if (nOptions.length === 1) {
    const obj: GroupSelectOptions = nOptions[0]
    if (obj.oneSelectVal === null)
      filterText.value = ''
    else
      filterText.value = formatFilterText(obj)
  }
  else {
    filterText.value = `分组 · ${nOptions.length}`
  }

  // 存储到本地
  setGroupData(nOptions, filterText.value)

  emits(
    'change',
    orderRt.optionSelect?.map(item => ({ field: item.oneSelectVal }))
      .filter(item => item.field),
    isChange,
  )
}

/**
 * 处理筛选框显示文字
 */
function formatFilterText(obj: GroupSelectOptions) {
  const one = oneOptions.find(item => item.value === obj.oneSelectVal)?.label
  return `分组 · ${one} `
}

/**
 * 分组-更新 第一个的剩余下拉集合
 */
function updateOneOption() {
  orderSRt.oneOverList = oneOptions.filter(
    item => !orderRt.optionSelect.map(itm => itm.oneSelectVal).includes(item.value),
  )
}

/**
 * 分组-更新 第二个的下拉集合
 */
async function updateTwoOption() {
  await nextTick()
  updateOneOption()
  updateData()
}

/**
 * 分组-添加项
 */
function addOption() {
  if (orderRt.optionSelect.length && !orderRt.optionSelect[orderRt.optionSelect.length - 1].oneSelectVal)
    return

  orderRt.optionSelect.push({
    oneSelectVal: null,
    isOpen: true,
  })
}

/**
 * 分组-删除项
 * @param val 第一个的选择值
 */
function delOption(val: string | null, index: number) {
  if (val) {
    orderRt.optionSelect.splice(
      orderRt.optionSelect.map(item => item.oneSelectVal).indexOf(val),
      1,
    )
    updateOneOption()
    updateData()
  }
  else {
    orderRt.optionSelect.splice(index, 1)
  }
  if (orderRt.optionSelect.length === 0) {
    filterText.value = ''
    setGroupData([], '')
  }
}

/**
 * 分组-清空
 */
function clearOption(isChange: boolean = true) {
  filterText.value = ''
  orderRt.optionSelect = []

  // 第一个为空则不触发更新
  updateData(isChange)
  updateOneOption()
  setGroupData([], '')
  visible.value = false
}

let cacheKey: string
let oldKey: string
let updateTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 显示隐藏的回调
 * @param isShow 是否显示
 */
function beChange(isShow: boolean) {
  if (isShow && oldKey !== cacheKey) {
    oldKey = cacheKey

    updateTimer && clearTimeout(updateTimer)

    updateTimer = setTimeout(() => {
      updateTimer = null

      updateOneOption()
    }, 800)
  }
  if (isShow && orderRt.optionSelect.length < 1)
    orderRt.optionSelect.push({ isOpen: false, oneSelectVal: null })
}

// 设置本地过滤数据
function setGroupData(arr: GroupSelectOptions[], text: string) {
  projectStore.setGroupData(cacheKey, arr, text)
}

function setCacheData(cacheData: string) {
  cacheKey = cacheData

  const groupData = projectStore.getGroupData(cacheKey)

  filterText.value = groupData?.data.length > 0 ? groupData?.text || '' : ''
  orderRt.optionSelect = groupData?.data?.length > 0 ? groupData?.data : []

  updateData(false)
}

defineExpose({
  clearOption,
  setCacheData,
})
</script>

<template>
  <a-popover
    v-model:open="visible"
    placement="bottomLeft"
    :align="{ offset: [0, -4] }"
    trigger="click"
    :overlay-class-name="grabbing ? 'pop-order search-group-grabbing' : 'pop-order project-filter-popover-box-shadow'"
    @open-change="beChange"
  >
    <template #content>
      <div v-if="orderRt.optionSelect.length" class="order-ul">
        <div v-for="(element, index) in orderRt.optionSelect" :key="index">
          <div class="order-li flex mb10">
            <BBaseSelectTool
              v-model:value="element.oneSelectVal"
              v-model:isOpen="element.isOpen"
              style="min-width: 264px"
              placeholder="请选择分组项"
              :is-icon="true"
              :options="orderSRt.oneOverList"
              size="default"
              @change="updateTwoOption"
            >
              <template #option="{ label, icon }">
                <div class="flex-row-start gap8 text12">
                  <svg-icon :name="icon" size="12" color="#666666" />
                  {{ label }}
                </div>
              </template>
            </BBaseSelectTool>
            <div
              class="order-icon-close flex-row-center pointer"
              @click="delOption(element.oneSelectVal, index)"
            >
              <svg-icon name="close" size="16" />
            </div>
          </div>
        </div>
      </div>
      <div class="flex order-footer">
        <div>
          <div v-if="orderRt.optionSelect?.length < groupLevel" class="order-add flex-row-center" @click="addOption">
            <div class="order-icon-add flex-row-center">
              <svg-icon name="add" size="8" />
            </div>
            <p class="name ml4 flex-one text12">
              添加分组条件
            </p>
          </div>
        </div>

        <div>
          <p v-if="orderRt.optionSelect.length" class="order-clear" @click="clearOption(true)">
            清空条件
          </p>
        </div>
      </div>
    </template>
    <template #title>
      <div class="order-title pfm color-title mb12">
        设置分组条件
      </div>
    </template>
    <div class="item flex-row-center flex-shrink-0" :class="filterText === '' ? '' : 'active'">
      <svg-icon name="group" size="14" />
      <p class="name ml4 flex-one ss-line-1" :class="{ pr0: filterText !== '' }">
        <!-- {{ filterText === '' ? '分组' : filterText }} 分组 -->
        分组
      </p>
      <!-- <svg-icon name="arrow-b" size="20"></svg-icon> -->
    </div>
  </a-popover>
</template>

<style lang="scss" scoped>
.drag-icon-container {
  cursor: grab;
  width: 24px;
  text-align: center;
  svg {
    color: #8e8e8e;
    &:hover {
      color: #5b5b5b !important;
    }
  }
  &:active {
    cursor: grabbing;
  }
}
</style>

<style lang="scss">
.ghost-class {
  border-top: 2px solid #1d74f5;
  > div,
  > svg {
    opacity: 0.2;
  }
}
.search-group-chosen {
  &.sortable-drag {
    background: initial !important;
    box-shadow: none;
    border: none !important;
    .drag-icon {
      display: inline-block !important;
    }
    .order-icon-close {
      width: 14px;
      height: 14px;
      margin-left: 12px;
      border-radius: 100%;
      background: rgba(0, 0, 0, 0.45);
      flex: none;
      color: #fff;
    }
  }
}
.search-group-grabbing {
  cursor: grabbing;
  .drag-icon-container {
    cursor: grabbing;
  }
}
</style>
