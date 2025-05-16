<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useCopy } from '@/utils'
import { userResetPwd } from '@/api/system'

const props = withDefaults(defineProps<Props>(), {
  nickName: '',
  userId: 0,
})

const emits = defineEmits(['onClose', 'onSave'])
const newPwd = ref('')
interface Props {
  nickName: string
  userName: string
  userId: number
}

onMounted(() => {})

//
interface TsDestruction {
  setShow: boolean
  title: string
  setTyp: number
  pwdShow: boolean
}

const destructionData = reactive<TsDestruction>({
  setShow: true,
  title: `确认重置 ${props.nickName}<span class="minor-color">（${props.userName}）</span>登录密码？`,
  setTyp: 1,
  pwdShow: false,
})

function closeClick() {
  emits('onClose')
}

// 复制链接   .A)a5d.n
function copyPwd() {
  useCopy(newPwd.value, '内容已复制到剪贴板')
}

// 确认
async function firmClick() {
  destructionData.setShow = false
  destructionData.pwdShow = true
  const id = props.userId.toString()
  if (id) {
    const { data } = await userResetPwd(id)

    newPwd.value = data.newPwd
  }
}
</script>

<template>
  <div>
    <!-- 重置登录密码 -->
    <b-dialog
      v-model:dialogVisible="destructionData.setShow"
      title-icon="warning.svg"
      :title="destructionData.title"
      confirm-btn-color="danger"
      confirm-btn-text="确认"
      @on-confirm="firmClick()"
      @on-cancel="closeClick()"
    />

    <!-- 重置密码成功 -->
    <b-dialog
      v-model:dialogVisible="destructionData.pwdShow"
      title="登录密码重置成功"
      header-padding="24px"
      confirm-btn-text="确认"
      :show-footer="false"
      @on-confirm="closeClick()"
      @on-cancel="closeClick()"
    >
      <div class="leave-dialog-main">
        <!-- <p class="desc text14 icon-color mb16">确认重置 昵称 (用户名) 登录密码？</p> -->
        <div class="icon-color main-box">
          <p class="text14 projectLi">
            {{ nickName }}<span class="minor-color">（{{ userName }}）</span>新登录密码已生效
          </p>
          <el-tooltip content="点击复制" :show-after="100" placement="top">
            <div class="box-hover box box-link flex-row-center pointer copyConBg" @click="copyPwd">
              <svg-icon name="pwd-icon" color="#999" size="16" />
              <span class="ml10 line18"> {{ newPwd }}</span>
            </div>
          </el-tooltip>
        </div>
      </div>
      <div class="btn-box flex-row-end mt24 pb24">
        <a-button type="primary" @click="closeClick()">
          确认
        </a-button>
      </div>
    </b-dialog>
  </div>
</template>

<style scoped lang="scss">
.projectLi {
  font-weight: initial;
  line-height: 22px;
  color: #333;
}
.main-box {
  display: flex;
  flex-direction: column;
}

.copyConBg {
  border-radius: 6px;
  padding: 9px 12px;
  background: rgba(0, 0, 0, 0.04);
  color: #333333;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px auto 0;
  &:hover {
    color: $color-primary;
  }
}
</style>
