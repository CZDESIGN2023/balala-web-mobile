<script lang="ts" setup>
import { ref, shallowRef } from 'vue'

const versionPopoverRef = ref()
const version = shallowRef<string>(
  `${import.meta.env.VITE_VERSION_DATE} V${import.meta.env.VITE_UPDATE_VERSION}`,
)

// 关闭版本弹框
function closeVersionPop() {
  versionPopoverRef.value?.closePop()
}
</script>

<template>
  <div class="page-footer text10 max-content">
    <div class="flex-row-center mb5">
      Design By ©2024 <a class="pointer" target="_blank" href="https://github.com/freecb/balala">CZ·DESIGN</a>
    </div>
    <div class="flex-row-center">
      <div>Licensed Under <a class="pointer" target="_blank" href="https://opensource.org/license/BSD-3-clause">BSD-3-Clause</a></div>
      <b-table-popover
        ref="versionPopoverRef"
        custom-class="version-popover"
        :is-foot="false"
        placement="top"
        :align="{ offset: [0, -15] }"
        confirm-text="我知道了"
      >
        <template #content>
          <div class="version-info">
            <p class="title-color text16 pfm">
              版本更新内容
            </p>
            <div class="text text14 icon-color">
              <el-scrollbar max-height="200px">
                <div class="pr24">
                  功能上新<br>
                  - 项目设置「流程管理」新增自定义流程功能；<br>
                  - 任务系统「任务单」新增批量升级流程功能；<br>
                  <br>
                  问题修复<br>
                  - [工具栏]筛选项目标值未同步最新数据的问题；<br>
                  - [创建项目]成员搜索框点击会清除已有内容的问题；<br>
                  - [任务系统]操作日志偶现记录其他任务单内容的问题；<br>
                  - [个人设置]缺少登出日志的问题；<br>
                </div>
              </el-scrollbar>
            </div>
            <div class="flex-row-end pr24">
              <a-button class="btn confirm-btn flex-shrink-0 white-color" @click="closeVersionPop">
                我知道了
              </a-button>
            </div>
          </div>
        </template>
        <a class="pointer ml10">[{{ version }}]</a>
      </b-table-popover>
    </div>
  </div>
</template>

<style lang="scss">
.version-popover {
  .btn {
    font-size: 14px;
  }
}
</style>

<style lang="scss" scoped>
.page-footer {
  width: 100%;
  height: 25px;
  color: rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 20;
  line-height: 10px;
  flex-shrink: 0;
  a {
    color: rgba(0, 0, 0, 0.25);
  }
}
</style>
