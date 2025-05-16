<script lang="ts" setup>
import { computed, h, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useCopy } from '@/utils'
import { SvgIcon } from '@/components/SvgIcon'
import { deleteWork, taskFollow } from '@/api/project'
import { permCheck } from '@/utils/permission'
import { WorkItemPerm } from '@/enum'
import type { WorkDetailData, WorkItemStatus } from '@/api/interface'

const props = defineProps({
  tabKey: {
    type: String,
    default: 'base',
  },
})

const emits = defineEmits(['update:followed', 'onRefreshTable'])

const formPermission = ref<Record<string, boolean>>({})

const state = reactive({
  followed: false,
  spaceId: '',
  workItemId: '',
  workItemStatus: {} as WorkItemStatus,
  workItemName: '',
  tabKey: 'base',
  deleteTaskDialogVisible: false,
})

// 关注图标显示数据
const followTooltipData = computed(() => {
  const isFollowed = state.followed || false
  const followTooltipData = {
    followed: {
      title: '取消关注',
      name: 'follow',
      color: '#FF9800',
    },
    notFollowed: {
      title: '关注任务',
      name: 'unfollow',
      color: '#333333',
    },
  }
  return isFollowed ? followTooltipData.followed : followTooltipData.notFollowed
})

// 更多下拉数据
const dropDownData = computed(() => {
  const isDelete = permCheck(formPermission.value, WorkItemPerm.WORK_ITEM_DELETE)
  const isShowDropdown = isDelete
  return {
    isShow: isShowDropdown,
    isDelete,
  }
})

// 关注/取消关注任务
async function changeFollow(followed: boolean) {
  try {
    await taskFollow(state.workItemId || '', followed)
    const msg = followed ? '取消关注成功！' : '关注任务成功！'
    message.success(msg, 2)
    state.followed = !state.followed
  }
  catch (error) {}
}

// 复制链接
function handleCopyLink() {
  const href = window.location.href.split('?')[0]
  const title = `#${state.workItemId} 丨 ${state.workItemName}`
  const link = `${href}?workItemId=${state.workItemId}&tabKey=${props.tabKey}&spaceId=${state.spaceId}&openType=child_detail`
  const content = `${title}\n${link}`

  useCopy(content, '链接已复制到剪贴板')
}

// 复制任务ID
function handleCopyTaskId(id: string) {
  const message = h('div', {
    innerHTML: `<div  style="color: #333333;">已复制 ID <span class="pfm">「${id}」</span></div>`,
  })
  const copyId = `#${id}`
  useCopy(copyId, message)
}

// 删除任务
async function handleTaskDelete() {
  try {
    await deleteWork(state.spaceId, state.workItemId)
    message.success('任务删除成功', 2)
    state.deleteTaskDialogVisible = false
    emits('onRefreshTable', [])
  }
  catch (errorInfo) {
    state.deleteTaskDialogVisible = false
  }
}

// 抛出事件获取所需数据
function setData(data: WorkDetailData) {
  const { followed, operationPermissions } = data
  state.followed = followed as boolean
  state.spaceId = data.spaceId
  state.workItemId = data.id
  state.workItemName = data.workItemName
  state.workItemStatus = data.workItemStatus

  try {
    formPermission.value = JSON.parse(operationPermissions as string)
  }
  catch (error) {
    formPermission.value = {}
  }
}

defineExpose({
  setData,
})
</script>

<template>
  <a-dropdown
    :align="{ offset: [0, 5] }"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    trigger="click"
  >
    <div class="tool-box flex-row-center">
      <SvgIcon name="more" color="#333333" size="6.15385vw" />
    </div>
    <template #overlay>
      <div class="more">
        <div
          class="id flex-row-center pl8 pr8 pointer"
          :class="dropDownData.isShow ? '' : 'border0'"
        >
          <div
            class="idbox w144 h32 br4 flex-row-start pl8"
            @click="handleCopyTaskId(state.workItemId)"
          >
            ID: #{{ state.workItemId }}
          </div>
        </div>
        <div class="ul pr8 pt8 pb8">
          <div
            class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer"
            @click="changeFollow(state.followed as boolean)"
          >
            <SvgIcon
              :name="followTooltipData.name"
              :color="followTooltipData.color"
              size="4.10256vw"
            />
            {{ followTooltipData.title }}
          </div>

          <div class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer" @click="handleCopyLink">
            <SvgIcon name="link" color="#333333" size="4.10256vw" />
            复制链接
          </div>

          <div
            v-if="dropDownData.isShow && dropDownData.isDelete"
            class="del-box error-color w144 h32 br4 flex-row-start pl8 gap8 pointer"
            @click="state.deleteTaskDialogVisible = true"
          >
            <SvgIcon
              class="tag-delete-icon pointer"
              name="node-edit-del"
              size="4.10256vw"
              color="#FD4C4C"
            />
            删除
          </div>
        </div>
      </div>
    </template>
  </a-dropdown>
  <!-- 删除任务弹框 -->
  <b-dialog
    v-model:dialogVisible="state.deleteTaskDialogVisible"
    width="480px"
    title="确认删除任务吗？"
    title-icon="warning.svg"
    confirm-btn-color="danger"
    confirm-btn-text="删除"
    @on-confirm="handleTaskDelete"
  >
    <div>
      <div>1. 删除后，该任务的所涉及成员将收到任务删除的消息。</div>
      <div>
        2.
        删除后，该任务的所有数据将不可访问，且不可恢复，其中，关联该任务的链接也将自动移除，链接将不可访问。
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.tool-link {
  border-radius: 6px 0px 0px 6px;
  border-right: 0;
}

.more {
  width: 160px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid $tool-drop-box-border;
  box-shadow: $tool-drop-box-shadow;
  padding: 0 8px;
  .id {
    width: 100%;
    height: 48px;
    padding: 8px 0;
    display: flex;
    color: $color-icon;
    align-items: center;
    border-bottom: 1px solid $color-border-minor;
    .idbox {
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
    }
  }
  .ul {
    .control-item {
      &:active {
        background: $color-default-active;
      }
    }
    .end-box,
    .del-box {
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
    }
  }
}
</style>
