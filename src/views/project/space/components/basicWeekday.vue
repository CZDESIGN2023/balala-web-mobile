<script lang="ts" setup>
import _ from 'lodash'
import { computed, onMounted, reactive, ref, watch } from 'vue'

/** TYPE */
interface Props {
  isEdit?: boolean
  workingDay: number[]
}

/** PROPS */
const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  workingDay: () => [],
})

/** EMIT */
const emits = defineEmits(['onChange', 'onCancelChange'])

/** DATA */
const weekLabels = ['一', '二', '三', '四', '五', '六', '日']
const weeks = reactive(
  Array.from({ length: 7 }, (_, index) => ({
    label: `周${weekLabels[index === 0 ? 0 : index]}`,
    value: (index + 1) % 7,
    disabled: false,
    checked: false,
  })),
)
const checkedList = ref([...props.workingDay])

// 计算已选日期
const weekData = computed(() => {
  changeGroup(checkedList.value)
  weeks.map(item => ({
    ...item,
    checked: props.workingDay.includes(item.value),
  }))
  return weeks
})

// 点击确认
function confirm() {
  if (_.isEqual(checkedList.value, props.workingDay)) {
    emits('onCancelChange')
    return
  }
  emits('onChange', checkedList.value)
}

// 点击取消
function cancel() {
  emits('onCancelChange')
}

function changeGroup(checkedValues: number[]) {
  // 设置每个项的选中状态
  weeks.forEach((item) => {
    item.checked = checkedValues.includes(item.value)
  })
  // 如果只有一个值被选中，禁用其他选项
  if (checkedValues.length === 1) {
    weeks.forEach((item) => {
      item.disabled = !!item.checked
    })
  }
  else {
    // 如果有多个值被选中，确保所有选项都是可用的
    weeks.forEach((item) => {
      item.disabled = false
    })
  }
}

watch(
  () => props.workingDay,
  (newVal) => {
    checkedList.value = [...newVal]
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="basic-weekday" :class="{ edit: isEdit }">
    <a-checkbox-group v-model:value="checkedList" class="flex-row-between" @change="changeGroup">
      <div
        v-for="item in weekData"
        :key="item.value"
        class="item text14 pfm icon-color flex-row-center"
        :class="{
          checked: checkedList.includes(item.value),
          readonly: !isEdit,
          disabled: isEdit && item.disabled,
        }"
      >
        <p v-if="!isEdit" class="text14 icon-color" :class="{ pfm: checkedList.includes(item.value) }">
          {{ item.label }}
        </p>
        <a-checkbox
          v-else
          class="item-checkbox text14 icon-color"
          :disabled="item.disabled"
          :value="item.value"
        >
          {{ item.label }}
        </a-checkbox>
      </div>
    </a-checkbox-group>
  </div>
  <div v-if="isEdit" class="bottom flex-row-end mt24">
    <a-button class="btn cancel" @click="cancel">
      取消
    </a-button>
    <a-button class="btn confirm" @click="confirm">
      保存
    </a-button>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/_base';
.basic-weekday {
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  padding-bottom: 0;
  background: #ffffff;
  border: 1px solid $color-border-main;
  &.edit {
    :deep(.ant-checkbox-group) {
      flex-wrap: wrap;
      justify-content: start;
      .item {
        width: calc((100% / 5) - 4px * 6 / 5);
        margin-right: 4px;
      }
    }
    justify-content: start;
  }
  .item {
    height: 28px;
    width: calc((100% / 7) - 4px * 6 / 7);
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: default;
    &:last-child {
      margin-right: 0;
    }
    &.checked {
      background: rgba(29, 116, 245, 0.08);

      &:hover {
        background: rgba(29, 116, 245, 0.08);
      }
    }
    &:not(.checked):hover {
      background: rgba(0, 0, 0, 0.04);
    }
    &.readonly {
      &:not(.checked):hover {
        background: rgba(0, 0, 0, 0);
      }
    }
    &.disabled {
      background: none;
      &:hover {
        background: none;
      }
    }
  }
  .item-checkbox {
    // width: calc((100% / 5) - 4px * 6 / 5);
    width: auto;
    padding: 0 2px;
  }

  :deep(.ant-checkbox-group) {
    column-gap: 0;
  }

  :deep(.ant-checkbox-wrapper) {
    .ant-checkbox-inner {
      width: 14px;
      height: 14px;
      border-radius: 2px;
    }
    .ant-checkbox {
      margin-right: 6px;
      .ant-checkbox-inner::after {
        width: 4px;
        height: 7px;
        border-width: 1px;
        top: 45%;
        left: 3px;
      }
    }
    .ant-checkbox + span {
      padding-inline-start: 0px;
      padding-inline-end: 0px;
      color: $color-icon;
    }
  }
  .checked {
    :deep(.ant-checkbox-wrapper) {
      .ant-checkbox + span {
        @extend .pfm;
      }
    }
  }
}
</style>
