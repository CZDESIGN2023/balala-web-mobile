<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { setRole } from '@/api/system'

const props = withDefaults(defineProps<Props>(), {
  nickName: '',
  userName: '',
  userId: 0,
  typ: 0,
})

const emits = defineEmits(['onClose', 'onSave'])

interface Props {
  nickName: string
  userName: string
  userId: number
  typ: number
}

onMounted(() => {})

//
interface TsDestruction {
  show: boolean
  title: string
  setTyp: number
}

const typTxt = Number(props.typ) === 1 ? '设为系统管理员' : '撤销系统管理员'
const destructionData = reactive<TsDestruction>({
  show: true,
  title: `确认将 ${props.nickName}<span class="minor-color">（${props.userName}）</span>${typTxt}？`,
  setTyp: 1,
})

function closeClick() {
  emits('onClose')
}

// 确认
async function firmClick() {
  const id = props.userId.toString()
  if (Number(props.typ) === 1) {
    await setRole(id, '50')
    message.success('设置成功')
    emits('onSave')
  }
  else if (Number(props.typ) === 2) {
    await setRole(id, '0')
    message.success('撤销成功')
    emits('onSave')
  }
}
</script>

<template>
  <div>
    <!-- 设置管理员 -->
    <b-dialog
      v-model:dialogVisible="destructionData.show"
      title-icon="warning.svg"
      :title="destructionData.title"
      confirm-btn-color="danger"
      confirm-btn-text="确认"
      @on-confirm="firmClick()"
      @on-cancel="closeClick()"
    >
      <div v-if="Number(typ) === 1" class="leave-dialog-main">
        <div class="icon-color">
          <p class="text14 projectLi">
            设置后，该用户可在此进行重置密码操作
          </p>
        </div>
      </div>
    </b-dialog>
  </div>
</template>

<style scoped lang="scss">
.projectLi {
  font-weight: initial;
  line-height: 22px;
  margin-bottom: 2px;
}

.copyConBg {
  width: 128px;
  height: 36px;
  border-radius: 6px;
  padding: 9px 12px;
  background: rgba(0, 0, 0, 0.04);
  color: #333333;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px auto 0;
}
</style>
