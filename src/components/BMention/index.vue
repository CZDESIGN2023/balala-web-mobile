<script setup lang="ts">
import { message } from 'ant-design-vue'
import { debounce, throttle } from 'lodash'
import { onMounted, ref } from 'vue'

interface UserParam {
  value: string
  avatar: string
  label: string
  username: string
  pinyin: string
}

const props = withDefaults(defineProps<Props>(), {
  // 列表数据
  list: () => [],
})

const emits = defineEmits(['onMention'])

interface Props {
  list: UserParam[]
}

const currentItem = ref<UserParam>()
const mentionScrollRef = ref()
const currentItemIndex = ref(-1) // 新增的当前选中项的索引

// 选择用户
function chooseItem(item: UserParam, index: number) {
  emits('onMention', item)
  currentItemIndex.value = index
  currentItem.value = undefined
}

let scrollTop = 0

// 键盘选中
function chooseItemByKeyboard(index: number) {
  if (index >= 0 && index < props.list.length) {
    currentItem.value = props.list[index]
    currentItemIndex.value = index
    if (index * 48 >= 240 + scrollTop) {
      mentionScrollRef.value.scrollTo({
        top: (index + 1) * 48 - 240,
        behavior: 'smooth',
      })
      scrollTop = (index + 1) * 48 - 240
    }
    else if (index * 48 < scrollTop) {
      mentionScrollRef.value.scrollTo({
        top: index * 48,
        behavior: 'smooth',
      })
      scrollTop = index * 48
    }
  }
}

// 双击选择用户
// function dbChooseItem(item: UserParam) {
//   emits('onMention', item)
//   currentItem.value = undefined
// }

// 提及
// function handleMention() {
//   if (!currentItem.value) {
//     message.error('请先选择要@的用户', 2)
//     return
//   }
//   emits('onMention', currentItem.value)
//   currentItem.value = undefined
// }

// 键盘事件处理
function handleKeyDown(event: any) {
  event.preventDefault()
  switch (event.key) {
    case 'ArrowDown':
      chooseItemByKeyboard((currentItemIndex.value + 1) % props.list.length)
      break
    case 'ArrowUp':
      chooseItemByKeyboard((currentItemIndex.value - 1 + props.list.length) % props.list.length)
      break
    case 'Enter':
      if (currentItem.value) {
        emits('onMention', currentItem.value)
        currentItem.value = undefined
        currentItemIndex.value = 0
      }
      break
  }
}

// 默认选中第一个
// function setCurrentIndex(index: number = 0) {
//   currentItem.value = props.list[index]
// }

onMounted(() => {
  // mentionInputRef.value?.focus()
  // setCurrentIndex()
})

defineExpose({
  handleKeyDown,
})
</script>

<template>
  <div id="mention" class="b-mention" :tabindex="-1" @keydown="handleKeyDown">
    <el-scrollbar v-if="list.length > 0" ref="mentionScrollRef" max-height="63.58974vw" always>
      <div
        class="list pb8"
      >
        <div
          v-for="(item, index) in props.list"
          :key="item.value"
          class="item w222 h40 mt8 flex-row-start pointer"
          :class="{ active: currentItem?.value === item.value }"
          @click="chooseItem(item, index)"
        >
          <b-head
            :id="item.value"
            class="mr8"
            width="28px"
            :name="item.label"
            :src="item?.avatar || ''"
          />
          <div class="info">
            <p class="name text14 title-color ellipsis">
              {{ item.label }}
            </p>
            <p class="text12 minor-color ellipsis">
              {{ item.username }}
            </p>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <div v-else class="empty flex-row-center h104 text14 main-color">
      没有匹配结果，换个关键词试试
    </div>
    <!-- <div class="foot h48 flex-row-end pr8">
      <a-button class="btn" :disabled="list.length === 0" @click="handleMention">
        提及
      </a-button>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.b-mention {
  width: 240px;
  border-radius: 8px;
  border: 1px solid #e8e9eb;
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
  position: fixed;
  background: #fff;
  z-index: 9999;
  .list {
    padding-left: 8px;
    .item {
      padding: 0 8px;
      border-radius: 4px;
      &.active {
        background: $color-primary-active;
        &:hover {
          background: $color-primary-active;
        }
      }
      &:hover {
        background: $color-bg-hover;
      }
    }
  }
  .foot {
    border-top: 1px solid $color-border-main;
  }
  .btn {
    width: 60px;
    height: 32px;
    border-radius: 4px;
    background: $color-primary;
    border: 1px solid $color-primary;
    color: #ffffff;
    font-size: 14px;
    &:disabled {
      background: $color-border-main;
      border: 1px solid $color-border-main;
      color: #bfbfbf;
    }
  }
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  width: 170px;
  text-overflow: ellipsis;
}
</style>
