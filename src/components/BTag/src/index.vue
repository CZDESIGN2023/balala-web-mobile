<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref, shallowReactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { TagItem } from '@/api/interface'
import { useSpaceStore } from '@/stores/modules/space'
import { getTextLength, splitList } from '@/utils'
import { useProjectStore } from '@/stores/modules/project'
import { createTag } from '@/api/project'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'

defineOptions({ name: 'BTag' })

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
  copyList: () => [],
  spaceId: 0,
})
const emits = defineEmits(['onEdit', 'onDelete', 'onSelect', 'onRefresh'])
const projectStore = useProjectStore()

const isAddTag = ref(false)
// 标签新增
const tagAddInput = ref<HTMLDivElement>()

// 当前弹框是否显示
const popupVisible = ref<boolean>(false)

interface TSTagSRt {
  selectId: string
}

const tagSRt = shallowReactive<TSTagSRt>({
  selectId: '',
})
interface Props {
  list: TagItem[]
  copyList: TagItem[]
  spaceId?: number
}
let focusTimer: ReturnType<typeof setTimeout> | null = null
let animateTimer: ReturnType<typeof setTimeout> | null = null
let cacheKey: string
const tagListRef = ref()
const tagGrid = ref<any[]>()

const refList: any = reactive<HTMLDivElement[]>([])
const addTagTextAnimate = ref<boolean>(true)
watch(isAddTag, (newVal) => {
  if (newVal) {
    addTagTextAnimate.value = !newVal
    return
  }
  if (focusTimer)
    clearTimeout(focusTimer)
  if (animateTimer)
    clearTimeout(animateTimer)

  animateTimer = setTimeout(() => {
    addTagTextAnimate.value = !newVal
  }, 30)
  focusTimer = setTimeout(() => {
    tagAddInput.value?.blur()
  }, 400)
})

// 设置多个模块ref
function setItemRef(el: any, id: string | number) {
  if (el)
    refList[`tagInput${id}`] = el
}

function showArrowDot(arr: any) {
  return arr.filter((item: any) => item.id === tagSRt.selectId).length > 0
}

// 修改输入框状态
const currentIndex = ref<number[]>([])

// 输入框按下回车
function tagInputEnter(item: TagItem, isClose?: boolean) {
  setTimeout(() => {
    refList[`tagInput${item.id}`].children[0].children[0].blur()
    // 关闭右侧气泡框
    if (isClose)
      popupVisible.value = false
  }, 30)
}

// 监听是否显示其他标签
function changePopup(visible: boolean) {
  closeEditStu(visible)
  if (!visible)
    return
  popupVisible.value = visible
}

function closeEditStu(visible: boolean) {
  // 悬浮框为显示状态/不在编辑状态
  if (tagGrid.value?.[1].some((find: TagItem) => find.focus)) {
    popupVisible.value = true
    return
  }
  if (visible || !tagGrid.value?.[1].some((find: TagItem) => find.focus)) {
    popupVisible.value = false
    return
  }

  const arrIndex = currentIndex.value[0]
  const index = currentIndex.value[1]
  const item = tagGrid.value?.[arrIndex][index]
  tagInputEnter(item, true)
  currentIndex.value = []
}

// 点击选择
function tapItem(item: TagItem) {
  if (!item.readonly)
    return

  tagSRt.selectId = tagSRt.selectId === item.id ? '' : (item.id as string)
  updateData()
  setTagData()
}

const tagList = ref<TagItem[]>([])

function getRenderList() {
  const sideWidth = 244
  setTimeout(() => {
    const width
      = window.innerWidth
      - (document.getElementById('projectName') as HTMLElement)?.offsetWidth
      - sideWidth

    tagGrid.value = splitList(props.list, width)
  }, 100)
}

watch(
  () => props.list,
  (newVal) => {
    tagList.value = JSON.parse(JSON.stringify(newVal))

    getRenderList()
  },
  {
    immediate: true,
  },
)

onMounted(() => {
  // getRenderList()
  window.addEventListener('resize', getRenderList)
})

function updateData(isChange = true) {
  emits(
    'onSelect',
    tagSRt.selectId
      ? {
          field: 'tags',
          values: [tagSRt.selectId],
          operator: 'IN',
          spaceId: '0',
        }
      : undefined,
    isChange,
  )
}

function setTagData() {
  const cacheId = cacheKey.match(/\d+/)?.[0] || ''
  if (cacheId)
    window.localStorage.setItem(`projectTab${cacheId}`, 'table')

  projectStore.setTagData(cacheKey, tagSRt.selectId)
}

function setCacheData(cacheData: string) {
  cacheKey = cacheData

  tagSRt.selectId = projectStore.getTagData(cacheKey)

  updateData(false)
}

function clearOption() {
  projectStore.setTagData(cacheKey)
}

defineExpose({
  setCacheData,
  clearOption,
})
</script>

<template>
  <div class="b-tag flex-row-between b-tag-mw full-100">
    <div v-if="tagList.length > 0" ref="tagListRef" class="list flex-row-start">
      <div
        v-for="(item, index) in tagGrid && tagGrid[0]"
        :id="`${index}`"
        :key="item.id"
        :ref="(el: any) => setItemRef(el, item.id)"
        class="b-tag-item tag-item"
        :class="{
          'noPadding': item.focus,
          'is-active': tagSRt.selectId === item.id,
          'is-unvisible': item.isIntersecting,
          'is-visible': !item.isIntersecting,
        }"
        @click="tapItem(item)"
      >
        <span class="ant-input ant-input-disabled flex-row-center">
          {{ item.tagName }}
        </span>
      </div>
    </div>
    <a-popover
      v-if="tagGrid && tagGrid[1].length > 0"
      destroy-on-close
      placement="bottomLeft"
      :align="{ offset: [0, 2] }"
      :visible="popupVisible"
      overlay-class-name="b-tag-wrap"
      :on-visible-change="changePopup"
    >
      <template #content>
        <div class="more">
          <div class="flex-row-start flex-wrap">
            <div
              v-for="(item) in tagGrid && tagGrid[1]"
              :key="item.id"
              :ref="(el: any) => setItemRef(el, item.id)"
              class="b-tag-item flex-row-start"
              :class="{
                'noPadding': item.focus,
                'is-active': tagSRt.selectId === item.id,
              }"
              @click="tapItem(item)"
            >
              <div class="flex-row-center">
                <span class="ant-input ant-input-disabled flex-row-center">
                  {{ item.tagName }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div class="b-tag-item arrow-item" :class="{ active: showArrowDot(tagGrid?.[1]), rotate: popupVisible }">
        <svg-icon name="arrow-b" :size="24" color="#666" />
      </div>
    </a-popover>
  </div>
</template>

<style lang="scss" scoped>
.wrapper-animate {
  .tag-add-input {
    width: 240px !important;
    opacity: 1 !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}
.input-wrapper {
  width: 272px;
  height: 28px;
  position: relative;
  .error-tip {
    position: absolute;
    bottom: -25px;
    left: 0;
    color: #fd4c4c;
    font-size: 13px;
    font-weight: initial;
  }
}
.input-close {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: $tool-hover-bg;
  }
}
.tag-add-input {
  position: absolute;
  right: 35px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  opacity: 0;
  border: none;
  padding: 3px 0px;
  border-radius: 4px;
  background: rgba(29, 116, 245, 0.08);
  box-shadow: none !important;
  transition:
    width 0.4s cubic-bezier(0.4, 0, 0, 1),
    opacity 0.4s cubic-bezier(0.4, 0, 0, 1);
  &.ant-input-affix-wrapper-focused {
    border: 2px solid #1d74f5;
    background: #fff !important;
    :deep() {
      .ant-input-suffix {
        opacity: 1;
        pointer-events: auto;
      }
      .ant-input {
        color: rgba(0, 0, 0, 0.88) !important;
      }
    }
  }
  :deep() {
    .ant-input-suffix {
      opacity: 0;
      pointer-events: none;
    }
    .ant-input-clear-icon {
      color: rgba(0, 0, 0, 0.35);
      &:hover {
        color: $tool-close-icon-hover;
      }
    }
    .ant-input {
      color: #1d74f5 !important;
    }
  }
}
.borderRed {
  border: 2px solid #fd4c4c !important;
}
</style>

<style lang="scss">
.b-tag {
  // max-width: 960px;
  // min-width: 560px;
  .add-btn {
    position: absolute;
    right: 0;
    &:hover {
      background: $color-bg-hover;
    }
  }
}
.tag-dropdown-box {
  width: 64px;
  height: 32px;
  border-radius: 4px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid $tool-drop-box-border;
  box-shadow: $tool-drop-box-shadow;
  position: relative;
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
.b-tag-item {
  width: max-content;
  height: 24px;
  font-size: 14px;
  font-weight: initial;
  color: $color-title;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  border: 1px solid $color-border-main;
  margin-right: 8px;
  &:last-child {
    margin-right: 0;
  }
  &.noPadding {
    padding: 0;
  }
  .num {
    color: $color-minor;
    margin-left: 4px;
  }
  .ant-input {
    line-height: 1;
    padding: 2px 8px;
    font-size: 14px;
    text-align: center;
    &.focus {
      border: 2px solid $color-primary;
      min-width: 56px !important;
      padding: 0 7.5px;
      &:hover {
        background: none;
      }
    }
    &.error {
      border: 2px solid $color-error;
      min-width: 56px !important;
      padding: 0 7.5px;
      &:hover {
        background: none;
      }
    }
    &:hover {
      background: none;
    }
    &.ant-input-disabled {
      cursor: pointer;
      color: $color-title;
    }
  }
  .t-popup__content {
    margin-bottom: 4px;
  }
  &:hover {
    background: #f5f5f5;
    border: 1px solid #f5f5f5;
  }
  &.is-active {
    background: rgba(29, 116, 245, 0.08);
    border-color: transparent;

    // .num,
    .ant-input {
      color: #1d74f5;
    }
  }
  &.noPadding {
    padding: 0;
    &:hover {
      background: none;
    }
  }
  &.arrow-item {
    width: 24px;
    height: 24px;
    padding: 0;
    margin-top: -2px;
    border: 0;
    border: 1px solid transparent;
    .svg-icon {
      transition: 0.4s;
      transition-delay: 0.1s;
    }
    &:hover {
      background: #fff;
      border: 1px solid #f7f8fa;
      box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      .svg-icon {
        transform: rotate(180deg);
      }
    }
    &.active {
      background: rgba(29, 116, 245, 0.08);
      box-shadow: none;
      .svg-icon {
        use {
          fill: $color-primary !important;
        }
      }
      &::after {
        content: '';
        width: 6px;
        height: 6px;
        background: $color-primary;
        border-radius: 50%;
        position: absolute;
        right: -3px;
        top: -3px;
      }
    }
    &.rotate {
      .svg-icon {
        transform: rotate(180deg);
      }
    }
  }
}

.tag-edit-icon {
  &:hover {
    use {
      fill: $color-primary !important;
    }
  }
}

.tag-delete-icon {
  &:hover {
    use {
      fill: $color-error !important;
    }
  }
}

.b-tag-wrap {
  width: calc(100% - 32px);
  .ant-popover-content {
    .ant-popover-inner {
      overflow-y: scroll;
      margin-left: 15px;
      border: 1px solid $tool-drop-box-border;
      box-shadow: $tool-drop-box-shadow;
      padding: 12px 12px 4px 12px;
      background-color: #fff;
      // &::-webkit-scrollbar {
      //   width: 6px;
      // }
      // &::-webkit-scrollbar-thumb {
      //   //滑动滑块条样式
      //   border-radius: $tool-drop-scorll-radius;
      //   // background-color: #183e761f;
      // }
    }
  }
  .more {
    max-height: 294px;
    .b-tag-item {
      margin-bottom: 8px;
    }
  }
}
</style>
