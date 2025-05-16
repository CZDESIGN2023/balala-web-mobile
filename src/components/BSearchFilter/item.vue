<script lang="ts" setup>
import { computed, inject, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { SvgIcon } from '../SvgIcon'
import type {
  ConditionGroup,
  FilterOneOptions,
  TSDate,
  TSTwoItem,
} from './interface'
import { oneList, twoList } from './config'
import { configFilterTag } from './index'
import { checkObjectsWithoutThirdSelectVal, filterObjectsWithoutThirdSelectVal, hasValidCondition, projectAddIcon } from '@/mixins/condition'
import { isEmptyObject, throttle } from '@/utils'
import { FilterEnum } from '@/enum'
import router from '@/router'
import { setFilterTag } from '@/api/project'
import { useProjectStore } from '@/stores/modules/project'

defineOptions({ name: 'ItemIndex' })

const props = withDefaults(defineProps<Props>(), {
  data: () => ({
    conjunction: 'AND',
    conditions: [],
    conditionGroup: [],
  }),
  isProject: false,
})
const emits = defineEmits(['onChangeFilterData'])
interface Props {
  data: ConditionGroup
  isProject?: boolean
}
const projectStore = useProjectStore()
const workbenchTabkey: any = inject('workbenchTabkey', '')

const state = reactive({
  visibleGroupAdd: false,
})

const cacheKey = computed(
  () => `project_list_${props.isProject ? workbenchTabkey.value : router.currentRoute.value.params.id}`,
)

const filterData = computed(() => {
  return props.data
})
// 是否显示且或切换按钮
const isShowConjunction = computed(() => {
  const { conditions = [], conditionGroup = [] } = filterData.value || {}
  return conditions.length + conditionGroup.length > 1
})

// 且 或 文字
const conjunctionLabel = computed(() => (filterData.value.conjunction === 'OR' ? '或' : '且'))

// 是否显示清空全部条件按钮
const isShowClearCondition = computed(() => {
  const { conditions = [], conditionGroup = [] } = filterData.value || {}
  return conditions?.length + conditionGroup?.length > 0
})

// 是否显示保存条件按钮
const isShowSaveCondition = computed(() => {
  const isShow = checkObjectsWithoutThirdSelectVal(filterData.value)
  return isShow
})

// 是否存在条件列表
const conditionsAndGroupLength = computed(() => {
  return props.data.conditions.length + (props.data.conditionGroup ? props.data.conditionGroup.length : 0)
})

function isProjectCondition(item: any) {
  if (Array.isArray(item.oneSelectVal))
    return item.oneSelectVal[1]

  else
    return item.oneSelectVal
}

function beMode(val: FilterEnum | null) {
  return !val || [FilterEnum.EQ, FilterEnum.NOT_EQ].includes(val) ? 'combobox' : 'multiple'
}

// 添加筛选条件
function addOption() {
  filterData.value?.conditions?.push({
    oneSelectVal: null,
    twoOptions: [],
    twoSelectVal: null,
    thirdSelectVal: [],
    isOpen: true,
  })
}

// 添加分组
function addGroup() {
  filterData.value?.conditionGroup?.push({
    id: new Date().getTime(),
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
  })
}

function oneChange(index: number, val: string | string[]) {
  let typeVal: string

  if (typeof val === 'string') {
    typeVal = val
  }
  else {
    filterData.value.conditions[index].projectVal = val[0]
    typeVal = val[1]
  }

  const relatedTwoItems = oneList.find(item => item.value === typeVal)?.twoOptions
  const filteredTwoOptions: TSTwoItem[] = relatedTwoItems
    ? relatedTwoItems.map(item => twoList.find(itm => itm.value === item)).filter(Boolean) as TSTwoItem[]
    : []

  const { thirdSelectVal = [] } = filterData.value.conditions[index]
  filterData.value.conditions[index].twoOptions = filteredTwoOptions
  filterData.value.conditions[index].twoSelectVal = filteredTwoOptions[0].value
  filterData.value.conditions[index].thirdSelectVal = []
  // 如果第3个选项没有值, 修改不刷新数据
  if (!thirdSelectVal || (Array.isArray(thirdSelectVal) && thirdSelectVal.length === 0)) {
    return
  }
  updateTableData()
}

function twoChange(index: number, val: FilterEnum) {
  const { thirdSelectVal = [] } = filterData.value.conditions[index]
  filterData.value.conditions[index].twoSelectVal = val
  filterData.value.conditions[index].thirdSelectVal = []

  // 如果第3个选项没有值, 修改不刷新数据
  if (!thirdSelectVal || (Array.isArray(thirdSelectVal) && thirdSelectVal.length === 0)) {
    return
  }
  updateTableData()
}

function dateChange(index: number, val: TSDate) {
  filterData.value.conditions[index].thirdSelectVal = val
  if (isEmptyObject(val))
    return

  updateTableData()
}

function bondChange() {
  filterData.value.conjunction = filterData.value.conjunction === 'AND' ? 'OR' : 'AND'
  updateTableData()
}

function delOption(index: number) {
  const { thirdSelectVal = [] } = filterData.value.conditions[index]
  filterData.value.conditions.splice(index, 1)
  if (!thirdSelectVal || (Array.isArray(thirdSelectVal) && thirdSelectVal.length === 0)) {
    return
  }

  updateTableData()
}

/**
 * 筛选-删除组
 */
function delGroup(index: number, group: ConditionGroup) {
  const isValid = hasValidCondition(group)
  filterData.value.conditionGroup?.splice(index, 1)
  if (isValid)
    updateTableData()
}

function clearOption() {
  projectStore.setFilterData(cacheKey.value, [] as any, [] as any, '')
  // 清空条件按钮需要关闭弹窗
  updateTableData(true, true)
}

// 保存条件 生成新的筛选组
const saveFilterData = throttle(async () => {
  const conditionFilterObj: { [key: string]: string } = {}
  const workTab = projectStore.getHomeTabData()
  const key = `condition_${props.isProject ? workTab : router.currentRoute.value.params.id}`

  // 过滤出没有选择条件的选项
  const conditionData = filterObjectsWithoutThirdSelectVal(filterData.value)

  const newConditionName = generateUniqueConditionName(configFilterTag.value)
  // 这里可以添加将新条件添加到条件列表的逻辑
  const filterItem = {
    id: Math.random().toString(36).substring(2, 16),
    name: `${newConditionName}`,
    conditionData,
    isEdit: false,
  }
  configFilterTag.value.unshift(filterItem)
  conditionFilterObj[key] = JSON.stringify(configFilterTag.value)
  await setFilterTag(conditionFilterObj)
  message.success('筛选组保存成功', 2)
}, 600)

// 生成条件名 条件1，条件2，条件3，条件....
function generateUniqueConditionName(conditions: any[]): string {
  const pattern = /条件(\d+)/
  const namesWithNumbers = conditions
    .map(condition => condition.name.match(pattern))
    .filter(match => match !== null)
    .map(match => Number.parseInt(match![1], 10))

  // 找到最大的数字 ID 并加一
  const maxId = namesWithNumbers.length > 0 ? Math.max(...namesWithNumbers) : 0
  return `条件${maxId + 1}`
}

// 更新表格数据
function updateTableData(isClear: boolean = false, isCloseFilter: boolean = false) {
  let conditions = [] as any
  if (props.isProject && !configFilterTag.value.length) {
    conditions = [
      {
        oneSelectVal: null,
        twoOptions: [],
        twoSelectVal: null,
        thirdSelectVal: [],
        isOpen: true,
      },
    ]
  }
  const data = isClear
    ? {
        conjunction: 'AND',
        conditions,
        conditionGroup: [],
      }
    : filterData.value

  emits('onChangeFilterData', data, isCloseFilter, true)
}

function changeTimeFormatter(val: any) {
  if (!Array.isArray(val) && val.start) {
    return [val.start, val.complete]
  }
  return val
}
</script>

<template>
  <div v-if="conditionsAndGroupLength" class="flex order-ul">
    <!-- 且或条件 -->
    <div v-if="isShowConjunction" class="flex-column-center filter-bond-box">
      <div class="filter-bond-item filter-bond-top" />
      <div class="flex-row-center filter-bond-center" @click="bondChange">
        {{ conjunctionLabel }}
        <div class="filter-bond-icon" />
      </div>
      <div class="filter-bond-item filter-bond-bot" :class="{ 'has-group': filterData.conditionGroup && filterData.conditionGroup.length > 0 }" />
    </div>
    <!-- 数据条件 -->
    <div class="search-filter">
      <div
        v-for="(item, index) in filterData.conditions"
        :key="index"
        class="order-li flex"
      >
        <BBaseCascader
          v-if="props.isProject"
          v-model:value="item.oneSelectVal"
          v-model:isOpen="item.isOpen"
          :options="projectAddIcon()"
          placeholder="请选择筛选项"
          :allow-clear="false"
          @change="(val: string[]) => oneChange(index, val)"
        />
        <BBaseSelectTool
          v-else
          v-model:value="item.oneSelectVal"
          v-model:isOpen="item.isOpen"
          placeholder="请选择筛选项"
          :is-icon="true"
          :options="oneList.filter((find: FilterOneOptions) => find.value !== 'followers')"
          @change="(val: string) => oneChange(index, val)"
        >
          <template #option="{ label, icon }">
            <div class="flex-row-start gap8 text12">
              <SvgIcon :name="icon" size="12" color="#666666" />
              {{ label }}
            </div>
          </template>
        </BBaseSelectTool>
        <BBaseSelectTool
          v-model:value="item.twoSelectVal"
          placeholder="运算符"
          :options="item.twoOptions"
          :disabled="!item.oneSelectVal"
          @change="(val: string) => twoChange(index, val as FilterEnum)"
        />
        <div
          v-if="['plan_time'].includes(isProjectCondition(item))"
          class="filter-input-date-style"
        >
          <!-- <b-input-date
            :info="item.thirdSelectVal"
            :is-disabled="false"
            :hide-clear="true"
            height="30px"
            attach="_"
            :show-time-tips="true"
            @on-change="(val: TSDate) => dateChange(index, val)"
          /> -->
          <b-range-picker
            :value="changeTimeFormatter(item.thirdSelectVal)"
            width="100%"
            @update:value="(planTime:string[]) => dateChange(index, { start: planTime[0], complete: planTime[1] })"
          />
        </div>
        <FilterPersonSelect
          v-else-if="['directors', 'user_id', 'participators'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_personSelect}`"
          :value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :disabled="!item.oneSelectVal"
          :space-id="filterData.conditions[index].projectVal"
          :dropdown-match-select-width="216"
          :max-tag-count="1"
          scroll-max-height="220"
          :show-arrow="true"
          :single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          class="item-person-select"
          current-label="当前登录用户"
          content-direction="column"
          size="large"
          closable
          clear-not-restore
          @update:value="(val: string[]) => {
            item.thirdSelectVal = val
            updateTableData()
          }"
        />
        <BusinessPrioritySelect
          v-else-if="['priority'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_propertySelect}`"
          v-model:value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :max-tag-count="1"
          @change="updateTableData()"
        />
        <BusinessWorkStatusSelect
          v-else-if="['work_item_status'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_work_item_status}`"
          v-model:value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :space-id="filterData.conditions[index].projectVal"
          :max-tag-count="1"
          :tag-max-width="54"
          @change="updateTableData()"
        />
        <BusinessWorkFlowSelect
          v-else-if="['work_item_flow_id'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_work_item_flow_id}`"
          v-model:value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :tag-max-width="48"
          :space-id="filterData.conditions[index].projectVal"
          :max-tag-count="1"
          @change="updateTableData()"
        />
        <BusinessModuleSelect
          v-else-if="['work_object_id'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_work_object_id}`"
          v-model:value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :space-id="filterData.conditions[index].projectVal"
          :max-tag-count="1"
          @change="updateTableData()"
        />
        <BusinessVersionSelect
          v-else-if="['version_id'].includes(isProjectCondition(item))"
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_version_id}`"
          v-model:value="item.thirdSelectVal"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :space-id="filterData.conditions[index].projectVal"
          :max-tag-count="1"
          @change="updateTableData()"
        />
        <BFormNormalSelect
          v-else
          :key="`${item.twoSelectVal}_${item.oneSelectVal}_normalSelect}`"
          v-model:value="item.thirdSelectVal"
          :type="isProjectCondition(item)"
          placeholder="请选择目标值"
          :is-single="beMode(item.twoSelectVal as FilterEnum) === 'combobox'"
          :disabled="!item.oneSelectVal"
          :space-id="filterData.conditions[index].projectVal"
          :max-tag-count="1"
          @change="updateTableData()"
        />
        <div
          class="order-icon-close flex-row-center pointer"
          @click="delOption(index)"
        >
          <SvgIcon name="close" size="14" />
        </div>
      </div>
      <!-- <div class="filter-group">
        <div
          v-for="(item, index) in filterData.conditionGroup"
          :key="item.id"
          class="filter-group-wrap flex-row-center"
        >
          <div class="filter-group-item">
            <item :data="item" :is-project="props.isProject" @on-change-filter-data="updateTableData(false)" />
          </div>
          <a-tooltip placement="top">
            <template #title>
              <span>删除条件组</span>
            </template>
            <div class="order-icon-close flex-row-center pointer" @click="delGroup(index, item)">
              <SvgIcon name="close" size="14" />
            </div>
          </a-tooltip>
        </div>
      </div> -->
    </div>
  </div>
  <div class="flex order-footer">
    <div class="flex-row-center">
      <div class="order-add flex-row-center black-4" @click="addOption">
        <div class="order-icon-add flex-row-center">
          <SvgIcon name="add" size="10" />
        </div>
        <p class="name ml4 flex-one flex-row-start text12">
          添加筛选条件
        </p>
      </div>
      <!-- <span class="line ml4 mr4" /> -->
      <!-- <div
        class="order-group-add flex-row-center"
        @mouseenter="state.visibleGroupAdd = true"
        @mouseleave="state.visibleGroupAdd = false"
      >
        <SvgIcon name="filter-group-arrow" size="22" color="#1D74F5" />
        <div
          :class="{ 'creat-filter-group-show': state.visibleGroupAdd }"
          class="creat-filter-group text14 icon-color flex-row-start h32"
          @click="addGroup"
        >
          <p>添加筛选组条件</p>
        </div>
      </div> -->
    </div>
    <div class="condition-control">
      <p v-show="isShowSaveCondition" class="order-clear item" @click="saveFilterData">
        保存条件
      </p>
      <p v-show="isShowClearCondition" class="order-clear item" @click="clearOption">
        清空条件
      </p>
    </div>
  </div>
</template>

<style lang="scss">
.filter-input-date-style {
  flex: 1;
  margin-right: 5px;
  .b-input2 {
    height: 30px;
  }
  .mr16 {
    margin-right: 0 !important;
  }
  .ant-input {
    font-size: $filter-drop-font-size !important;
  }
}
</style>

<style lang="scss" scoped>
.condition-control {
  display: flex;
  .item {
    &:first-child {
      position: relative;
      margin-right: 16px;
      &:after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: -8px;
        width: 1px;
        height: 16px;
        background: $color-border-main;
      }
    }
  }
}
.filter-group-wrap {
  margin-top: 16px;
}
</style>

<style lang="scss">
  @import '../BSearchOrder/order.scss';
.two-sub-icon {
  span {
    margin-left: 8px;
  }
}
.filter-bond-item {
  flex: 1;
  width: 100%;
  position: relative;

  &::after {
    position: absolute;
    right: 0;
    width: 20px;
    content: '';
    border-left: 2px solid $color-border-main;
    height: calc(100% - 8px);
  }
}
.filter-bond-top::after {
  top: 8px;
  border-top: 2px solid $color-border-main;
  border-radius: 10px 0 0 0;
}
.filter-bond-bot::after {
  bottom: 8px;
  border-bottom: 2px solid $color-border-main;
  border-radius: 0 0 0 10px;
}
.filter-bond-bot {
  &.has-group::after {
    bottom: 50%;
    border-bottom: 2px solid $color-border-main;
    border-radius: 0 0 0 10px;
    transform: translateY(0%);
    height: 50%;
  }
}
.search-filter {
  flex: 1;
  max-width: 100%;
}
.filter-bond-box {
  width: 27px;
  padding-right: 6px;
}
.filter-bond-center {
  height: 24px;
  width: 100%;
  cursor: pointer;
  border-radius: 4px;
  width: 43px;
  margin-left: -4px;
  &:hover {
    background: $tool-hover-bg;
  }
  &:active {
    background: $tool-click-bg;
  }
}
.filter-bond-icon {
  width: 5px;
  height: 8px;
  margin-left: 8px;

  &::before,
  &::after {
    display: block;
    content: '';
    border-left: 2.5px solid transparent;
    border-right: 2.5px solid transparent;
  }
  &::before {
    border-bottom: 3px solid #333;
  }
  &::after {
    margin-top: 2px;
    border-top: 3px solid #333;
  }
}

.filter-no-condition
  > .order-ul
  > .full-100
  > .filter-group
  > .filter-group-wrap {
  margin-top: 0;
}

.filter-group {
  width: 100%;
}
.filter-group-item {
  width: 100%;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid $color-border-main;
  .order-clear {
    display: none;
  }
}
</style>
