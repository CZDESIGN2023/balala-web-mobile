<template>
  <div>
    <!-- 注销 -->
    <b-dialog
      v-if="!projectList.length"
      v-model:dialogVisible="destructionData.show"
      titleIcon="warning.svg"
      :title="destructionData.title"
      confirmBtnColor="danger"
      confirmBtnText="注销"
      @onCancel="closeClick()"
      @onConfirm="confirmSave"
    >
      <div class="leave-dialog-main">
        <p class="desc text14 icon-color mb16">注销成功后该账号将无法使用，数据将清空</p>
        <a-input
          allowClear
          class="gray-input"
          v-model:value="destructionData.nickName"
          placeholder="请输入用户名"
        >
          <template #clearIcon>
            <el-tooltip effect="dark" placement="top" :show-after="100" content="清空">
              <img class="delete-icon w16" src="@/assets/svg/input-close.svg" />
            </el-tooltip>
          </template>
        </a-input>
        <div class="agree text14 minor-color mt4 el-checkobx-label-color">
          <el-checkbox v-model="destructionData.checked" size="large"
            >我已知悉注销账号的风险</el-checkbox
          >
        </div>
      </div>
    </b-dialog>

    <!-- 注销二次弹窗 -->
    <b-dialog
      v-model:dialogVisible="destructionData.twoDlg"
      titleIcon="warning.svg"
      title="注销账号"
      :showFooter="false"
      @onConfirm="closeClick()"
      @onCancel="closeClick()"
    >
      <div class="leave-dialog-main">
        <p class="desc text14 icon-color mb16">您当前有项目未退出，请先退出，再注销账号：</p>
        <el-scrollbar height="160" class="icon-color project-con">
          <p class="text14 projectLi" v-for="item in projectList">{{ item.spaceName }}项目</p>
        </el-scrollbar>
      </div>
      <div class="btn-box flex-row-end mt24 pb24">
        <a-button type="warning" class="redBtn" @click="closeClick()">知道了</a-button>
      </div>
    </b-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, reactive, onMounted, inject } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { message } from 'ant-design-vue'
import router from '@/router'
import { LOGIN_URL } from '@/config'
import { useProjectStore } from '@/stores/modules/project'
import { myCancel, userLogout } from '@/api/user'
import { useNoticeStore } from '@/stores/modules/notice'

const socketClient: any = inject('socketClient')
const userStore = useUserStore()
const useNotice = useNoticeStore()
const userInfo = computed(() => userStore.userInfo)
const projectStore = useProjectStore()

type Props = {
  projectList: any
  nickName: string
}

const props = withDefaults(defineProps<Props>(), {
  // 项目列表
  projectList: () => {},
  nickName: ''
})
onMounted(() => {
  console.log(`output->projectList.length`, props.projectList.length)
})

// 注销
interface TsDestruction {
  // 是否显示弹窗
  show: boolean
  // 标题
  title: string
  // 用户昵称
  nickName: string
  // 是否知悉
  checked: boolean
  // 二次确认框
  twoDlg: boolean
}

const emits = defineEmits(['onClose', 'onSave'])

const destructionData = reactive(<TsDestruction>{
  show: true,
  title: '注销账号',
  nickName: '',
  checked: false,
  twoDlg: !!props.projectList?.length || false
})

// 注销账号
const confirmSave = async () => {
  if (destructionData.nickName === '') {
    message.error('请确认用户名', 2)
    return
  } else if (destructionData.nickName != userInfo.value.userName) {
    message.error('用户名输入错误', 2)
    return
  } else if (!destructionData.checked) {
    message.error('请确认已知悉注销账号的风险', 2)
    return
  }
  await myCancel()
    .then(() => {
      destructionData.show = false
      message.success('注销成功')
      emits('onClose')
      logout()
    })
    .catch((err) => {
      console.log(`output->err`, err)
      destructionData.show = false
    })
}

const closeClick = () => {
  destructionData.checked = false
  destructionData.twoDlg = false
  emits('onClose')
}

const logout = async () => {
  router.replace(LOGIN_URL)
  userStore.reset()
  projectStore.$reset()
  useNotice.reset(false)
  socketClient.closeWebsocket()
}
</script>
<style scoped lang="scss">
.project-con {
  height: 160px;
  .projectLi {
    font-weight: 500;
    height: 32px;
    line-height: 32px;
    font-size: 14px;
  }
}
.redBtn {
  background: #fd4c4c;
  width: 74px;
  height: 32px;
  border-radius: 4px;
  text-align: center;
  color: #fff;
  font-size: 14px;
  font-weight: initial;
}
</style>
