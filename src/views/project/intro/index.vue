<script lang="ts" setup>
import { provide, ref } from 'vue'
import { message } from 'ant-design-vue'
import introPanel from './panel.vue'
import introModule from './module.vue'
import introUser from './user.vue'
import versionModule from './version.vue'
import { editProjectDescribe } from '@/api/project'
import type { ProjectInfoData } from '@/api/interface'
import type { FilterSelectOptions } from '@/components/BSearchFilter/interface'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'

const props = withDefaults(defineProps<Props>(), {
  info: () => {
    return {}
  },
})
// EMITS
const emits = defineEmits(['onUpdate', 'onLeaveSpace', 'onChangeTab', 'onChangeFollow'])
const introRef = ref()
const introModuleRef = ref()
const introversionRef = ref()
const introUserRef = ref()
const describe = ref('')
const showEditor = ref<boolean>(false)
provide('view', true)
const { checkPerm } = usePermission()

// PROPS
interface Props {
  info: ProjectInfoData
}

function getContent(content: string) {
  describe.value = content || ''
}

function getTabChangeData(selectGroup?: FilterSelectOptions[]) {
  emits('onChangeTab', selectGroup)
}

// 富文本编辑器失焦
function editorBlur(describe: string) {
  showEditor.value = false
  // 修改信息
  editProjectDesc(describe)
}

// 修改项目描述
async function editProjectDesc(describe: string) {
  if (describe === props.info.describe)
    return
  try {
    await editProjectDescribe({
      spaceId: props.info.id,
      describe,
    })
    message.success('项目描述修改成功')
  }
  finally {
    emits('onUpdate', 'describe')
  }
}

function updateIntro() {
  introModuleRef.value?.getModulelist()
  introversionRef.value?.getVersionList()
  introUserRef.value?.getMemberlist()
}

defineExpose({
  updateIntro,
})
</script>

<template>
  <div ref="introRef" class="project-intro pb16">
    <div class="project-top">
      <intro-panel
        @on-change-tab="getTabChangeData"
        @on-change-follow="$emit('onChangeFollow')"
      />
      <div class="intro-desc">
        <h4 class="h32 title icon-color pfm text16 flex-row-start">
          <svg-icon class="mr6" name="project-intro-desc" color="#333333" size="16" />
          项目描述
        </h4>
        <div class="editor-box mt8">
          <b-editor
            v-if="info?.id"
            mode="introMode"
            :mode-key="`introMode${info?.id}`"
            :value="info?.describe"
            :space-id="info?.id"
            :readonly="!checkPerm(Perm.ModifySpaceDesc)"
            placeholder="知识库就像书一样,让多篇文档结构化,方便知识的创作与沉淀"
            read-content="知识库就像书一样,让多篇文档结构化,方便知识的创作与沉淀"
            :min-height="156"
            :max-height="480"
            @get-content="getContent"
            @editor-blur="editorBlur"
          />
        </div>
      </div>
    </div>

    <div class="intro-wrap intro-module mt24">
      <intro-module ref="introModuleRef" type="intro" @on-change-tab="getTabChangeData" />
    </div>
    <div class="intro-wrap intro-version mt24">
      <version-module ref="introversionRef" type="intro" @on-change-tab="getTabChangeData" />
    </div>
    <div class="intro-wrap intro-user mt24">
      <intro-user ref="introUserRef" @on-change-tab="getTabChangeData" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-intro {
  width: 100%;
  margin: 0 auto;
  .project-top {
    width: 100%;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #f7f8fa;
    background: #ffffff;
  }
  .intro-wrap {
    padding: 12px;
    background: #ffffff;
    border: 1px solid #f7f8fa;
    box-shadow: 0px 4px 20px 0px rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    position: relative;
    z-index: 99;
  }

  .manager {
    .module {
      width: calc(50% - 12px);
      height: 356px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid $color-border-minor;
      overflow: hidden;

      &:hover {
        box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
      }
    }

    .tools {
      height: 48px;
      padding: 0 16px;

      .member-num {
        font-size: 16px;
        font-weight: initial;
        color: #333;
      }

      .member-add {
        font-size: 13px;
        font-weight: initial;
        color: $color-primary;
        cursor: pointer;
      }
    }

    .module-manager {
      padding: 0 8px;

      .tools {
        padding: 0 8px 0 8px;
      }
    }
  }
}

.skeleton-style {
  :deep() {
    .ant-skeleton {
      width: 104px;
      height: 88px;
      border-radius: 8px;
    }
    .ant-skeleton-content .ant-skeleton-title {
      height: 100% !important;
    }
  }
}

.version {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #f7f8fa;
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.04);
  padding: 24px;
}

.project-top {
  background: #ffffff;
  .project-top-wrap {
    width: 100%;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -24px;
    height: 208px;
    margin-bottom: -24px;
    margin-top: -24px;
  }
  .project-top-content {
    width: 100%;
    margin: auto;
    // position: relative;
    // &::after {
    //   content: '';
    //   width: calc(100% - 48px);
    //   height: 24px;
    //   background: #fff;
    //   box-shadow: none;
    //   position: absolute;
    //   left: 50%;
    //   transform: translateX(-50%);
    //   top: -24px;
    //   border-radius: 12px 12px 0 0;
    // }
    // &::before {
    //   content: '';
    //   width: 99%;
    //   height: 24px;
    //   background: #fff;
    //   position: absolute;
    //   left: 0;
    //   bottom: -24px;
    //   box-shadow: none;
    //   border-radius: 0px 0px 12px 12px;
    // }
  }
}
</style>
