<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import type { CreateProject, UserListItem } from '@/api/interface'
import { createProject } from '@/api/project'
import { useProjectStore } from '@/stores/modules/project'
import { isEmptyObject, throttle } from '@/utils'
import router from '@/router'
import { verifySpacename } from '@/utils/validate'
import { useSpaceStore } from '@/stores/modules/space'

const projectStore = useProjectStore()
const projectFormRef = ref<FormInstance>()
const showEditor = ref<boolean>(false)
const loading = ref<boolean>(false) // 是否显示loading
const labelCol = { style: { width: '108px', display: 'flex', justifyContent: 'start' } }
const wrapperCol = { style: { width: '560px' } }
const spaceNamePlaceholder = ref<string>('给项目起一个好名字')

const spaceStore = useSpaceStore()

const projectForm = reactive<CreateProject>({
  space_name: '',
  describe: ``,
  users: [],
})

const cancelDialog = ref<boolean>(false)
const rules = reactive<Record<string, Rule[]>>({
  space_name: [{ validator: verifySpacename, required: true, trigger: 'change' }],
})

function getContent(content: string) {
  projectForm.describe = content
}

function editorBlur() {
  showEditor.value = false
}

// 获取已选成员列表
function getMemberList(list: UserListItem[]) {
  const filterList = list.map((item) => {
    return {
      userId: item.id,
      roleId: item.roleId,
    }
  })

  projectForm.users = filterList
}

// 取消
function cancel() {
  if (!isEmptyObject(projectForm))
    cancelDialog.value = true
  else
    router.back()
}

// 取消创建
function cancelCreate() {
  router.back()
}

// 确认提交
const submit = throttle(async () => {
  const params = {
    space_name: projectForm.space_name,
    describe: projectForm.describe,
    users: projectForm.users,
  }
  if (projectForm.describe?.includes(';base64')) {
    message.warning('请等待图片上传完成', 2)
    return
  }
  try {
    await projectFormRef.value?.validateFields()
    loading.value = true
    const { data } = await createProject(params)
    await projectStore.getList()
    message.success('项目创建成功', 2)
    router.push(`/project/${data.id}`)
  }
  catch (errorInfo) {
    loading.value = false
  }
}, 1500)

onMounted(() => {
  spaceStore.setUserStatus(0)
})
</script>

<template>
  <div class="project-add">
    <div class="single-title-header flex-row-start pfm font-smoothing">
      创建项目
    </div>
    <div class="project-form-wrap">
      <el-scrollbar>
        <div class="project-form">
          <a-form
            ref="projectFormRef"
            :model="projectForm"
            :rules="rules"
            class="project-add-form"
            name="basic"
            size="large"
            autocomplete="off"
            :label-col="labelCol"
            :wrapper-col="wrapperCol"
          >
            <a-form-item label="项目名称" name="space_name">
              <a-input
                v-model:value="projectForm.space_name"
                allow-clear
                class="gray-input"
                :placeholder="spaceNamePlaceholder"
                @focus="spaceNamePlaceholder = '请输入项目名称'"
                @blur="spaceNamePlaceholder = '给项目起一个好名字'"
              >
                <template #clearIcon>
                  <a-tooltip
                    v-if="spaceNamePlaceholder !== '给项目起一个好名字'"
                    title="清空"
                    effect="dark"
                  >
                    <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="项目描述" name="desc">
              <div class="editor-box">
                <b-editor
                  mode="addMode"
                  mode-key="addMode"
                  placeholder="请尽量清晰简洁有逻辑的描述该项目"
                  read-content="请尽量清晰简洁有逻辑的描述该项目"
                  :value="projectForm.describe"
                  :min-height="184"
                  :max-height="480"
                  @get-content="getContent"
                  @editor-blur="editorBlur"
                />
              </div>
            </a-form-item>
            <a-form-item label="项目成员" name="member">
              <b-member @on-get-member-list="getMemberList" />
            </a-form-item>
            <a-form-item>
              <div class="project-foot full-100 mt19 flex-row-end">
                <a-button class="btn cancel-btn mr16" @click="cancel">
                  取消
                </a-button>
                <a-button class="btn confirm-btn" type="primary" :loading="loading" @click="submit">
                  确认
                </a-button>
              </div>
            </a-form-item>
          </a-form>
        </div>
      </el-scrollbar>
    </div>
    <!-- 返回 -->
    <b-dialog
      v-model:dialogVisible="cancelDialog"
      width="408px"
      title="确认取消创建项目吗？"
      title-icon="warning-icon.svg"
      confirm-btn-color="primary"
      @on-confirm="cancelCreate"
    />
  </div>
</template>

<style lang="scss" scoped>
.project-add {
  height: 100%;
  display: flex;
  flex-direction: column;
  .project-form-wrap {
    width: 100%;
    height: calc(100% - 84px);
  }
  .project-form {
    width: 668px;
    height: 100%;
    margin: 0 auto;

    :deep(.el-form-item.is-error) {
      .project-input-item {
        .el-input__wrapper {
          background: none;
          box-shadow: 0 0 0 1px var(--el-color-danger) inset;
        }
      }
    }

    :deep(.el-form-item__content) {
      line-height: normal !important;
    }

    .editor-box {
      width: 100%;
      min-height: 184px;
      border-radius: 6px;

      &.border {
        border: 1px solid #1d74f5;
        background: #fff;

        &:hover {
          background: #fff;
        }
      }
    }

    .project-foot {
      .btn {
        // width: 53px;
        height: 32px;
        border-radius: 4px;
        font-size: 14px;
        border-width: 1px;
        padding: 0 12px;
        &.cancel-btn {
          border-color: $color-border-main;
        }
      }
    }
  }
}
</style>
