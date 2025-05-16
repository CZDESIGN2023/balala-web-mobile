<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref, shallowReactive, toRaw, watch } from 'vue'
import type { OrderOneOptions, OrderSelectOptions, OrderTwoItem } from './interface'
import { useProjectStore } from '@/stores/modules/project'
import type { FilterSort } from '@/api/interface/component'
import { deepCopy } from '@/utils'

// 深层响应集合
interface TSOrderRt {
  optionSelect: OrderSelectOptions[]
}

// 浅层响应集合
interface TSOrderSRt {
  // 第一个的剩余下拉集合
  oneOverList: OrderOneOptions[]
  showAddBtn: boolean
}

interface TSProps {
  isProject?: boolean
}

const props = withDefaults(defineProps<TSProps>(), {
  isProject: false,
})

const emits = defineEmits<{
  /**
   * 更新数据
   * @param val 选择项集合
   */
  change: [
    val: {
      source: OrderSelectOptions[]
      target: FilterSort[]
    },
    isChange: boolean,
  ]
}>()

const orderSRt = shallowReactive<TSOrderSRt>({
  oneOverList: [],
  showAddBtn: true,
})

const oneOptions: OrderOneOptions[] = [
  {
    value: 'space_id',
    label: '项目',
    icon: 'filter-project',
    twoOptions: [
      {
        value: 'DESC',
        front: '倒序',
        after: '正序',
        label: '正序',
      },
      {
        value: 'ASC',
        front: '正序',
        after: '倒序',
        label: '倒序',
      },
    ],
    // twoOptions: [
    //   {
    //     value: 'DESC',
    //     front: '新',
    //     after: '旧',
    //     label: '新 → 旧',
    //   },
    //   {
    //     value: 'ASC',
    //     front: '旧',
    //     after: '新',
    //     label: '旧 → 新',
    //   },
    // ],
  },
  {
    value: 'work_object_id',
    label: '所属模块',
    icon: 'filter-module',
    twoOptions: [
      {
        value: 'DESC',
        front: '倒序',
        after: '正序',
        label: '正序',
      },
      {
        value: 'ASC',
        front: '正序',
        after: '倒序',
        label: '倒序',
      },
    ],
  },
  {
    value: 'work_item_id',
    label: '任务创建时间',
    icon: 'filter-status',
    twoOptions: [
      {
        value: 'DESC',
        front: '新',
        after: '旧',
        label: '新 → 旧',
      },
      {
        value: 'ASC',
        front: '旧',
        after: '新',
        label: '旧 → 新',
      },
    ],
  },
  {
    value: 'priority',
    label: '优先级',
    icon: 'filter-priority',
    twoOptions: [
      {
        value: 'DESC',
        front: '倒序',
        after: '正序',
        label: '正序',
      },
      {
        value: 'ASC',
        front: '正序',
        after: '倒序',
        label: '倒序',
      },
    ],
  },
  {
    value: 'work_item_flow_id',
    label: '任务流程',
    icon: 'filter-type',
    twoOptions: [
      {
        value: 'DESC',
        front: '倒序',
        after: '正序',
        label: '正序',
      },
      {
        value: 'ASC',
        front: '正序',
        after: '倒序',
        label: '倒序',
      },
    ],
  },
]

if (!props.isProject)
  oneOptions.splice(0, 1)

const projectStore = useProjectStore()

// 筛选框文字
const filterText = ref<string>('')
const visible = ref<boolean>(false)

// 初始化 第二个的默认下拉集合
const twoDefaultOption: OrderTwoItem[] = oneOptions[0].twoOptions
const defaultSortItem = {
  oneSelectVal: null,
  twoOptions: twoDefaultOption,
  twoSelectVal: twoDefaultOption[0].value,
  isOpen: false,
}

const orderRt = reactive<TSOrderRt>({
  optionSelect: [],
})
// 初始化 剩余下拉集合
orderSRt.oneOverList = [...oneOptions]

/**
 * 排序-更新数据
 */
function updateData(isChange: boolean = true) {
  const copySortItem = deepCopy(defaultSortItem)
  if (!orderRt.optionSelect.length && !isChange)
    orderRt.optionSelect = [copySortItem]

  const targetData: FilterSort[] = toRaw(orderRt.optionSelect).map((item) => {
    return {
      field: item.oneSelectVal as string,
      order: item.twoSelectVal,
      field_type: '',
    }
  })

  const fOptions = [...toRaw(orderRt.optionSelect)]

  const nOptions = fOptions.filter((item) => {
    if (item.oneSelectVal !== null && typeof item.oneSelectVal === 'object') {
      if ((item.oneSelectVal as any).length)
        return true
    }
    else if (item.oneSelectVal) {
      return true
    }
  })

  if (nOptions.length === 0) {
    filterText.value = ''
  }
  else if (nOptions.length === 1) {
    const obj: OrderSelectOptions = nOptions[0]
    if (obj.oneSelectVal === null)
      filterText.value = ''
    else
      filterText.value = formatFilterText(obj)
  }
  else {
    filterText.value = `排序 · ${nOptions.length}`
  }

  // 存储到本地
  setSortData(nOptions, filterText.value)

  emits('change', { source: toRaw(orderRt.optionSelect), target: targetData }, isChange)
}

/**
 * 处理筛选框显示文字
 */
function formatFilterText(obj: OrderSelectOptions) {
  const one = oneOptions.find(item => item.value === obj.oneSelectVal)?.label
  return `排序 · ${one} `
}

/**
 * 排序-更新 第一个的剩余下拉集合
 */
function updateOneOption() {
  orderSRt.oneOverList = oneOptions.filter(
    item => !orderRt.optionSelect.map(itm => itm.oneSelectVal).includes(item.value),
  )
}

/**
 * 排序-更新 第二个的下拉集合
 * @param val 第一个的选择值
 */
async function updateTwoOption(val: string) {
  await nextTick()
  const index = orderRt.optionSelect.findIndex(item => item.oneSelectVal === val)
  if (index === -1) {
    return
  }
  // 更新twoOptions
  orderRt.optionSelect[index].twoOptions = oneOptions.filter(item => item.value === val)[0].twoOptions

  // 更新twoSelectVal
  orderRt.optionSelect[index].twoSelectVal = 'DESC'

  // 更新oneOption和data
  updateOneOption()
  updateData()
}

/**
 * 排序-更新 第二个的选择值
 * @param val1 第二个的选择值
 * @param val2 第一个的选择值
 */
function updateTwoVal(val1: string, val2: string | null) {
  if (val2) {
    orderRt.optionSelect[
      orderRt.optionSelect.map(item => item.oneSelectVal).indexOf(val2)
    ].twoSelectVal = val1
    updateData()
  }
  else {
    orderRt.optionSelect[orderRt.optionSelect.length - 1].twoSelectVal = val1
  }
}

/**
 * 排序-添加项
 */
function addOption() {
  if (
    orderRt.optionSelect.length
    && !orderRt.optionSelect[orderRt.optionSelect.length - 1].oneSelectVal
  )
    return

  orderRt.optionSelect.push({
    oneSelectVal: null,
    twoOptions: twoDefaultOption,
    twoSelectVal: twoDefaultOption[0].value,
    isOpen: true,
  })
}

/**
 * 排序-删除项
 * @param val 第一个的选择值
 */
function delOption(val: string | null, index: number) {
  orderRt.optionSelect.splice(index, 1)
  updateOneOption()
  updateData()

  if (orderRt.optionSelect.length === 0) {
    filterText.value = ''
    setSortData([], '')
  }
}

/**
 * 排序-清空
 */
function clearOption(isChange: boolean = true) {
  const firstVal = orderRt.optionSelect[0]?.oneSelectVal
  const copySortItem = deepCopy(defaultSortItem)
  filterText.value = ''
  orderRt.optionSelect = [
    copySortItem,
  ]
  // 第一个为空则不触发更新
  firstVal && updateData(isChange)
  updateOneOption()
  setSortData([], '')
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
}

// 设置本地过滤数据
function setSortData(arr: OrderSelectOptions[], text: string) {
  projectStore.setSortData(cacheKey, arr, text)
}

function setCacheData(cacheData: string) {
  cacheKey = cacheData
  const copySortItem = deepCopy(defaultSortItem)
  const sortData = projectStore.getSortData(cacheKey)

  filterText.value = sortData?.data.length > 0 ? sortData?.text || '' : ''

  orderRt.optionSelect = sortData?.data || [copySortItem]

  orderSRt.showAddBtn = !!oneOptions.filter(
    item => !orderRt.optionSelect.map(itm => itm.oneSelectVal).includes(item.value),
  ).length

  updateData(false)
}

watch(
  () => orderSRt.oneOverList,
  (val) => {
    orderSRt.showAddBtn = !!val.length
  },
)

watch(
  () => visible.value,
  (val) => {
    if (!val) {
      const copySortItem = deepCopy(defaultSortItem)
      setTimeout(() => {
        if (!orderRt.optionSelect.length)
          orderRt.optionSelect = [copySortItem]
      }, 300)
    }
  },
)

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
    overlay-class-name="pop-order project-filter-popover-box-shadow"
    @open-change="beChange"
  >
    <template #content>
      <div v-if="orderRt.optionSelect.length" class="order-ul">
        <div
          v-for="(item, index) in orderRt.optionSelect"
          :key="item.oneSelectVal || undefined"
          class="order-li flex"
          :class="{
            'del-hover': item.hover,
          }"
        >
          <BBaseSelectTool
            v-model:value="item.oneSelectVal"
            v-model:isOpen="item.isOpen"
            placeholder="请选择排序项"
            :is-icon="true"
            :options="orderSRt.oneOverList"
            size="default"
            @change="updateTwoOption"
          >
            <template #option="{ label, icon }">
              <div class="flex-row-start gap8 text14">
                <svg-icon :name="icon" size="12" color="#666666" />
                {{ label }}
              </div>
            </template>
          </BBaseSelectTool>

          <div class="flex-row-center order-list mr4">
            <div
              v-for="(ytem, index) in item.twoOptions"
              :key="ytem.value"
              class="flex-row-center order-item"
              :class="{
                'is-active': item.twoSelectVal === ytem.value,
              }"
              @click="updateTwoVal(ytem.value, item.oneSelectVal)"
            >
              {{ ytem.label }}
              <svg-icon
                v-if="ytem.label === '正序' || ytem.label === '倒序'"
                class="flex-shrink-0 ml4 mr4"
                :name="`order-${index ? 'asc' : 'desc'}`"
                size="12"
                color="#333333"
              />
            </div>
          </div>

          <a-tooltip placement="top">
            <template #title>
              <span>删除条件</span>
            </template>
            <div
              class="order-icon-close flex-row-center pointer"
              @click="delOption(item.oneSelectVal, index)"
              @mouseenter="item.hover = true"
              @mouseleave="item.hover = false"
            >
              <svg-icon name="close" size="16" />
            </div>
          </a-tooltip>
        </div>
      </div>
      <div class="flex order-footer">
        <div>
          <div v-if="orderSRt.showAddBtn" class="order-add flex-row-center" @click="addOption">
            <div class="order-icon-add flex-row-center">
              <svg-icon name="add" size="10" />
            </div>

            <p class="name ml4 flex-one text12">
              添加排序条件
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
        设置排序条件
      </div>
    </template>
    <div class="item flex-row-center flex-shrink-0" :class="filterText === '' ? '' : 'active'">
      <svg-icon name="sort" size="14" />
      <p class="name ml4 flex-one ss-line-1" :class="{ pr0: filterText !== '' }">
        <!-- {{ filterText === '' ? '排序' : filterText }} -->
        排序
      </p>
    </div>
  </a-popover>
</template>

<style lang="scss">
@import './order.scss';
</style>
