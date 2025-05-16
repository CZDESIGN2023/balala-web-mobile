<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { userSpaceQuit, userWorkItemCount } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'
import { SpaceRole } from '@/enum'
import { deleteProject, getMemberListById, projectTransferOwnership } from '@/api/project'
import { useNoticeStore } from '@/stores/modules/notice'

const props = withDefaults(defineProps<Props>(), {
  isTransfer: false,
})
const emit = defineEmits(['leaveSuccess'])
const userStore = useUserStore()
const noticeStore = useNoticeStore()
const projectStore = useProjectStore()

interface Props {
  // 是否为转移项目,true:转移，false:离开  true时用户为项目创建者
  isTransfer?: boolean
}

interface TSLeaveData {
  // 是否显示弹窗
  show: boolean
  // 标题
  title: string
  // 任务没完成数描述
  desc: string
  // 项目id
  spaceId: string
  // 目标id
  targetUserId: null | string
  // 任务没完成数
  count: number
  // 是否勾选
  checked: boolean
  // 负责人
  options: any[]
  filterOptions: any[]
  // 移除的项目名
  spaceName: string
  // 是否存在成员
  hasUser: boolean
  // 是否存在项目管理员
  hasAdminUser: boolean
}

const leaveData = reactive<TSLeaveData>({
  show: false,
  title: '',
  desc: '',
  spaceId: '',
  targetUserId: null,
  count: 0,
  checked: false,
  options: [],
  filterOptions: [],
  spaceName: '',
  hasUser: false,
  hasAdminUser: false,
})

const showSelect = computed(() => {
  return leaveData.count && leaveData.hasUser
//   return (
//     (props.isTransfer && leaveData.hasUser)
//     || (!props.isTransfer && leaveData.count > 0 && leaveData.hasUser)
//   )
})

const placeholder = computed(() => {
//   return props.isTransfer ? '请选择指定项目管理员' : '请选择任务转移指定成员'
  return '请选择任务转移指定成员'
})

const selectOptions = computed(() => {
  return leaveData.options
//   return props.isTransfer ? leaveData.filterOptions : leaveData.options
})

// 显示弹窗
function leaveShow(row: any) {
  nextTick(() => {
    // 转移
    // if (props.isTransfer) {
    //   getTransferInfo(row)
    //   return
    // }
    // 离开
    getLeaveInfo(row)
  })
}

// 转移创建者
const space_name = ref<string>('')
// async function getTransferInfo (row: any) {
//   leaveData.title = '是否确认转移项目空间创建者？'
//   leaveData.spaceId = row.id
//   leaveData.targetUserId = null
//   leaveData.spaceName = row.spaceName
//   await getWorkItemCount(row)
//   await getMemberList(row)

//   leaveData.show = true
// }

// async function getWorkItemCount(row: any) {
//   const { data } = await userWorkItemCount({
//     userId: userStore.userInfo.id as string,
//     spaceId: row.id as string,
//   })

//   let countTotle = 0

//   if (data && data.COUNT)
//     countTotle = Number(data.COUNT)

//   leaveData.count = countTotle
// }

// 1.只有自己，走删除项目
// 2.有成员，但是没有设置项目管理员，提示无项目管理员
// 3.有项目管理员，选择

// async function getMemberList (row: any) {
//   const res = await getMemberListById({
//     spaceId: row.id,
//   })

//   const userList = res.data.list
//     .map((item: any) => {
//       item.value = item.userId
//       item.label = item.userNickname
//       return item
//     })
//     .filter((find: any) => find.userId !== userStore.userInfo.id)

//   const adminUserList = res.data.list
//     .map((item: any) => {
//       item.value = item.userId
//       item.label = item.userNickname
//       return item
//     })
//     .filter(
//       (find: any) =>
//         find.userId !== userStore.userInfo.id && find.roleId === SpaceRole.SUPER_MANAGER,
//     )

//   leaveData.options = userList
//   leaveData.filterOptions = adminUserList
//   leaveData.hasAdminUser = adminUserList.length > 0
//   leaveData.hasUser = userList.length > 0

//   if (!leaveData.options?.length
//     leaveData.title = '是否确认删除项目？'
// }

// 离开项目
async function getLeaveInfo(row: any) {
  leaveData.title = `确认离开 ${row.spaceName} 项目吗？`
  leaveData.spaceName = row.spaceName
  leaveData.spaceId = row.id
  leaveData.targetUserId = null
  const { data } = await userWorkItemCount({
    userId: userStore.userInfo.id as string,
    spaceId: row.id as string,
  })
  if (!data)
    return

  let countTotle = 0

  countTotle = Number(data.COUNT)

  leaveData.count = countTotle

  if (countTotle) {
    const { data } = await getMemberListById({
      spaceId: row.id,
    })
    const userList = data.list
      .map((item) => {
        item.value = item.userId
        item.label = item.userNickname
        return item
      })
      .filter(item => item.userId !== userStore.userInfo.id)
    leaveData.options = userList
    leaveData.hasUser = userList.length > 0
    leaveData.title = `您已关联任务 <span class='minor-color'>${countTotle}</span> ，确认离开吗？`
    leaveData.desc = '离开前需要将任务转移至指定项目成员'
  }
  else {
    leaveData.options = []
  }
  leaveData.show = true
}

// 点击确认按钮
async function leaveConfirm() {
  const isTransferAndNoTargetUser = props.isTransfer && !leaveData.targetUserId && leaveData.hasUser
  const isNotTransferAndNoTargetUser
    = !props.isTransfer && !leaveData.targetUserId && leaveData.count > 0 && leaveData.hasUser

  if (isTransferAndNoTargetUser || isNotTransferAndNoTargetUser) {
    const errorMessage = props.isTransfer ? '请指定项目管理员' : '请选择成员'
    message.error(errorMessage, 2)
    return
  }

  if (props.isTransfer && !leaveData.hasUser) {
    if (!space_name.value) {
      message.error('请输入项目名称', 2)
      return
    }
    else if (space_name.value !== leaveData.spaceName) {
      message.error('项目名称输入错误', 2)
      return
    }
  }

  if (!leaveData.checked) {
    let msg = props.isTransfer ? '请确认已知悉转移创建者的风险' : '请确认已知悉离开项目的风险'
    if (props.isTransfer && !leaveData.options?.length)
      msg = '请确认已知悉删除项目的风险'

    if (props.isTransfer || (!props.isTransfer && leaveData.count)) {
      message.error(msg, 2)
      return
    }
  }

  // 有成员时转移-转移项目
  if (props.isTransfer && leaveData.options?.length)
    fnTransfer()

  // 没成员时转移-删除项目
  else if (props.isTransfer && !leaveData.options?.length)
    fnDelProject()

  // 离开项目
  else
    fnLeaveData()

  space_name.value = ''
}

// 确认 - 转移项目创建者
async function fnTransfer() {
  await projectTransferOwnership(leaveData?.spaceId || '', leaveData?.targetUserId || '')
  message.success(`项目 ${leaveData.spaceName} 已成功转移`, 2)
  leaveData.show = false
  leaveData.checked = false
  emit('leaveSuccess')
  await projectStore.getList()
  if (Number(noticeStore.joinSpaceId) === Number(leaveData.spaceId))
    noticeStore.setJoinTooltip(false)
}

// 确认 - 离开
async function fnLeaveData() {
  const { data } = await userSpaceQuit({
    spaceId: leaveData.spaceId,
    targetUserId: leaveData.targetUserId || undefined,
  })

  if (!data)
    return
  await projectStore.getList()
  if (leaveData.count)
    message.success(`项目 ${leaveData.spaceName} 已移除，成功转移 ${leaveData.count} 条任务`, 2)
  else
    message.success(`项目 ${leaveData.spaceName} 已移除`, 2)

  leaveData.show = false
  leaveData.checked = false
  if (Number(noticeStore.joinSpaceId) === Number(leaveData.spaceId))
    noticeStore.setJoinTooltip(false)
  emit('leaveSuccess')
}

// 确认 - 删除项目
async function fnDelProject() {
  await deleteProject(leaveData.spaceId || '', leaveData.spaceName)
  message.success('项目删除成功', 2)
  leaveData.show = false
  leaveData.checked = false
  emit('leaveSuccess')
  await projectStore.getList()
}

defineExpose({
  leaveShow,
})

// 获取风险勾选文案
function getText(isTransfer: boolean, count: number) {
  if (isTransfer && count)
    return '转移创建者'
  else if (isTransfer && !count)
    return '删除项目'
  else
    return '离开项目'
}

// 获取确认按钮文案
function getBtnText(isTransfer: boolean, count: number) {
  if (isTransfer && count)
    return '确认'
  else if (isTransfer && !count)
    return '删除'
  else
    return '离开'
}

function onCancel() {
  leaveData.checked = false
  space_name.value = ''
}
</script>

<template>
  <b-dialog
    v-model:dialogVisible="leaveData.show"
    :title-icon="isTransfer && leaveData.options?.length ? 'orange.svg' : 'warning.svg'"
    :title="leaveData.title"
    :confirm-btn-color="isTransfer && leaveData.options?.length ? 'primary' : 'danger'"
    :confirm-btn-text="getBtnText(isTransfer, leaveData.options?.length)"
    @on-cancel="onCancel"
    @on-confirm="leaveConfirm"
  >
    <div class="leave-dialog-main">
      <!-- <p v-if="isTransfer && leaveData.hasUser" class="desc text14 icon-color mb16">
        1.需转移给项目管理员，该成员将获得项目创建者权限。<br>
        2.您在此项目中的权限将自动变更为“可管理”。
      </p>

      <p v-else-if="isTransfer && !leaveData.hasUser" class="desc text14 icon-color mb16">
        1. 点击“删除”后，该项目的所有管理员将收到项目删除的消息。<br>
        2.删除后，该项目的所有数据将不可访问，且不可恢复，其中，关联该项目其他数据/链接也将自动清除关联值，链接将不可访问。
        <a-input v-model:value="space_name" class="gray-input mt20" placeholder="输入项目名称" />
      </p> -->

      <p v-if="leaveData.count" class="desc text14 icon-color mb16">
        {{ leaveData.desc }}
      </p>
      <BBaseSelect
        v-if="showSelect"
        v-model:value="leaveData.targetUserId"
        size="large"
        :placeholder="placeholder"
        :options="selectOptions"
      >
        <template #notFoundContent>
          <p class="text14 main-color flex-row-center h54">
            当前未设置项目管理员
          </p>
        </template>
      </BBaseSelect>
      <div v-if="leaveData.count" class="agree text14 minor-color mt4 el-checkobx-label-color">
        <el-checkbox v-model="leaveData.checked" size="large">
          我已知悉{{ getText(isTransfer, leaveData.options?.length) }}的风险
        </el-checkbox>
      </div>
    </div>
  </b-dialog>
</template>
