<script lang="ts" setup>
import { h, onMounted, reactive, ref } from 'vue'
import type { VxeGridInstance } from 'balala-vxe-table'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { gridOptions } from './config/table'

import UserSearch from './components/userSearch.vue'
import ResetPwd from './components/resetPwd.vue'
import SetManage from './components/setManage.vue'
import AddUser from './components/addUser.vue'
import EditUser from './components/editUser.vue'
import type { TableTaskItem } from '@/api/interface'
import { adminUserList } from '@/api/system'
import { formatDate } from '@/utils'
import { useUserStore } from '@/stores/modules/user'
import { SvgIcon } from '@/components/SvgIcon'

const prevIcon = h(SvgIcon, { name: 'pagination-arrow-l', size: 16, color: '#333333' })
const nextIcon = h(SvgIcon, { name: 'pagination-arrow-r', size: 16, color: '#333333' })

// 用户信息
const { userInfo } = useUserStore()
// 表格实例
const xGrid = ref<VxeGridInstance<TableTaskItem>>()
const customScrollRef = ref() // 自定义滚动条 DOM
const addUserRef = ref()
const editUserRef = ref()
const tableOptions = gridOptions()
tableOptions.loading = false
const postData = {
  page: 1,
  pageSize: 20,
  searchVal: '',
}
// 总数
const totalVal = ref(0)
const curPage = ref(1)
const tableData = ref([])
onMounted(() => {
  getData()
})

async function getData() {
  try {
    const { data } = await adminUserList(postData.searchVal, postData.pageSize, postData.page - 1)
    const $grid = xGrid.value
    if ($grid) {
      data.items.map((item: any) => {
        item.lastLoginTime = formatDate(item.lastLoginTime, 'YYYY.MM.DD HH:mm:ss', '-')
      })
      $grid.reloadData(data.items)
    }
    tableData.value = data.items
    totalVal.value = Number(data.total)
    postData.page++
    // 分页数据
    const pageVal = Math.ceil(totalVal.value / postData.pageSize)
    zhCn.el.pagination = {
      pagesize: '条/页',
      goto: '跳至',
      pageClassifier: `/${pageVal}页`,
    }
  }
  catch (error: any) {
  }
}

// 分页
const small = ref(false)
const disabled = ref(false)

function handleSizeChange(val: number) {
  console.log(`${val} items per page`)
}
function handleCurrentChange(val: number) {
  postData.page = val
  curPage.value = val
  getData()
}

// 查询
function searchChange(data: any) {
  if (data) {
    postData.searchVal = data.values[0]
    postData.page = 1
    curPage.value = 1
    getData()
  }
  else {
    postData.searchVal = ''
    postData.page = 1
    curPage.value = 1
    getData()
  }
}

// 重置登录密码
const isResetPwd = ref(false)
const userNickName = ref('')
const userName = ref('')
const userId = ref(0)
function handleResetPwd(nick_name: string, user_name: string, id: number) {
  isResetPwd.value = true
  userNickName.value = nick_name
  userName.value = user_name
  userId.value = id
}

// 设置管理员
const isSetVal = ref(false)
const setTyp = ref(0)
function handleSetManager(typ: number, nick_name: string, user_name: string, id: number) {
  userNickName.value = nick_name
  userName.value = user_name
  userId.value = id
  setTyp.value = typ
  isSetVal.value = true
}

// 修改用户信息
function handleEditUser(nickname: string, id: number) {
  editUserRef.value.openDialog({ nickname, userId: id })
}

// 刷新
function reseatData() {
  isSetVal.value = false
  curPage.value = 1
  postData.page = 1
  getData()
}

// 监听滚动条自定义滚动
function handleScroll(e: { scrollLeft: number, scrollTop: number }) {
  xGrid.value?.scrollTo(0, e.scrollTop)
}

// 打开添加用户弹框
function openAddUserDialog() {
  addUserRef.value.openDialog()
}

function gridScroll(e: { scrollTop: number }) {
  customScrollRef.value?.setScrollTop(e.scrollTop)
}
</script>

<template>
  <div class="manager-user-wrap">
    <div class="tool flex-row-start gap8">
      <div class="item flex-row-start gap4" @click="openAddUserDialog">
        <SvgIcon name="add" size="16" color="#333333" />
        账号
      </div>
      <UserSearch @change="searchChange" />
    </div>
    <div class="con pt12" :class="{ 'no-pagation': totalVal === 0 }">
      <div class="table-wrap" :style="{ maxHeight: tableData.length === 0 ? '100%' : `${((tableData.length + 1) * 44)}px` }">
        <!-- 表格 -->
        <vxe-grid
          ref="xGrid"
          class="project-lis"
          :row-config="{ isCurrent: false, isHover: false }"
          v-bind="tableOptions"
          max-height="100%"
          min-height="100%"
          :params="{
            isGroup: false,
          }"
          :scroll-y="{
            enabled: false,
          }"
          @scroll="gridScroll"
        >
          <template #user_header>
            <p class="pl2 font-smoothing table-title">
              昵称/用户名
            </p>
          </template>
          <template #nick_name="{ row }">
            <div class="flex-row-start">
              <b-head
                :id="row.id"
                class="mr8"
                width="28px"
                :name="row.userNickname"
                fs="text13"
                :src="row?.avatar || ''"
              />
              <p class="text14 icon-color font-smoothing">
                {{ row.userNickname }}<span class="text14 minor-color ml6">{{ row.userName }}</span>
              </p>
              <p v-if="Number(row.role) === 100" class="roleTag tagOrange">
                超管
              </p>
              <p v-if="Number(row.role) === 50" class="roleTag tagBlue">
                管理员
              </p>
            </div>
          </template>
          <template #time_header>
            <p class="pl2 font-smoothing table-title">
              最近登录时间
            </p>
          </template>
          <template #login_time="{ row }">
            <p class="pl2 minor-color font-smoothing">
              {{ row.lastLoginTime }}
            </p>
          </template>
          <template #operate_header>
            <p class="pl2 font-smoothing table-title">
              操作
            </p>
          </template>
          <template #operate="{ row }">
            <a-popover
              v-if="userInfo.role > Number(row.role) || (row.id === userInfo.id)"
              trigger="hover"
              placement="bottomRight"
              :align="{ offset: [0, -6] }"
              overlay-class-name="user-popover"
            >
              <template #content>
                <div
                  class="right-btn binBtn"
                  @click="handleResetPwd(row.userNickname, row.userName, row.id)"
                >
                  重置密码
                </div>
                <div
                  class="right-btn binBtn"
                  @click="handleEditUser(row.userNickname, row.id)"
                >
                  编辑
                </div>
                <div
                  v-if="Number(row.role) === 50 && Number(userInfo.role) === 100"
                  class="right-btn binBtn"
                  @click="handleSetManager(2, row.userNickname, row.userName, row.id)"
                >
                  撤销系统管理员
                </div>
                <div
                  v-if="Number(row.role) === 0 && Number(userInfo.role) === 100"
                  class="right-btn binBtn"
                  @click="handleSetManager(1, row.userNickname, row.userName, row.id)"
                >
                  设为系统管理员
                </div>
              </template>
              <div class="more-icon flex-row-center pointer br4">
                <SvgIcon name="my-more" :size="16" color="#333333" />
              </div>
            </a-popover>
          </template>

          <template #empty>
            <b-empty
              v-if="tableData"
              img-name="no-data-search.svg"
              :is-svg="false"
              icon-mb="5px"
              desc="暂无内容"
            />
          </template>
        </vxe-grid>

        <!-- 自定义滚动条 -->
        <el-scrollbar
          ref="customScrollRef"
          always
          max-height="calc(100% - 256px)"
          class="scrollbar"
          @scroll="handleScroll"
        >
          <div class="w6" :style="{ height: `${tableData.length * 44}px` }" />
        </el-scrollbar>
      </div>
      <!-- 分页 -->
      <div v-if="totalVal > 0" class="paginationBox">
        <span class="pl16 font-smoothing">当前共 {{ totalVal }} 条</span>
        <div class="demo-pagination-block">
          <el-config-provider :locale="zhCn">
            <el-pagination
              v-model:current-page="curPage"
              v-model:page-size="postData.pageSize"
              :locale="zhCn"
              background
              :small="small"
              :disabled="disabled"
              layout="prev, pager, next, jumper"
              :total="totalVal"
              :default-current-page="0"
              :prev-icon="prevIcon"
              :next-icon="nextIcon"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </el-config-provider>
        </div>
      </div>
      <!-- 重置登录密码 -->
      <ResetPwd
        v-if="isResetPwd"
        :user-name="userName"
        :nick-name="userNickName"
        :user-id="userId"
        @on-close="isResetPwd = false"
      />
      <!-- 设置管理员 -->
      <SetManage
        v-if="isSetVal"
        :user-name="userName"
        :nick-name="userNickName"
        :user-id="userId"
        :typ="setTyp"
        @on-close="isSetVal = false"
        @on-save="reseatData"
      />
      <!-- 添加账号 -->
      <AddUser ref="addUserRef" @on-update="reseatData" />
      <!-- 编辑（昵称） -->
      <EditUser ref="editUserRef" @on-update="reseatData" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import './scss/table.scss';
.table-title {
  color: #666;
}
.table-wrap {
  height: 100%;
  overflow: hidden;
  &:hover {
    .scrollbar {
      opacity: 1;
    }
  }
}
.scrollbar {
  position: absolute;
  right: 24px;
  top: 172px;
  bottom: 0;
  opacity: 0;
  :deep(.el-scrollbar__bar.is-vertical) {
    right: 0px;
  }
}
.manager-user-wrap {
  height: 100%;
  .tool {
    width: 100%;
    height: 32px;
    .item {
      font-size: 14px;
      height: 32px;
      color: $color-icon;
      padding: 0 8px;
      border-radius: 4px;
      cursor: pointer;
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
    }
  }
  .con {
    width: 100%;
    height: calc(100% - 40px);
    display: flex;
    flex-direction: column;
    &.no-pagation {
      height: calc(100% - 88px);
    }

    .li_hd {
      height: 44px;
      width: 100%;
      border-bottom: 1px solid $color-border-main;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      span {
        font-size: 15px;
        font-weight: 500;
        line-height: 44px;
        border-bottom: 2px solid #1d74f5;
        color: #1d74f5;
        display: inline-block;
        margin-top: -1px;
      }
      // 右侧搜索
      .hd_right {
        display: flex;
        align-items: center;
        cursor: pointer;
        .search-con {
          display: flex;
          flex-direction: row;
          align-items: center;
          font-size: 13px;
          font-weight: initial;
          color: #181818;
        }
      }
    }
    .more-icon {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      margin: 0 auto;
      &:hover {
        background: $color-default-active;
      }
    }
    // 标签
    .roleTag {
      height: 18px;
      line-height: 11px;
      height: 19px;
      border-radius: 4px;
      padding: 4px 6px 4px 6px;
      display: inline-flex;
      font-size: 11px;
      font-weight: initial;
      margin-left: 8px;
    }
    .tagOrange {
      color: #ef6c00;
      background: #fff3e0;
    }
    .tagBlue {
      color: #1d74f5;
      background: $color-primary-active;
    }
  }
  .project-lis :deep(.vxe-table) {
    .vxe-table--header-wrapper {
      border-radius: 6px 6px 0 0;
    }
  }
}

.user-popover {
  .binBtn {
    padding: 0 8px;
    margin-bottom: 4px;
    height: 32px;
    line-height: 32px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: initial;
    cursor: pointer;
    &:last-of-type {
      margin-bottom: 0;
    }
  }
  .binBtn:hover {
    background: $tool-hover-bg;
  }
}

.paginationBox {
  height: 40px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 12px;
  align-items: center;
  > span {
    font-size: 13px;
    font-weight: initial;
    color: #666666;
  }
}
</style>

<style lang="scss">
.manager-user-wrap {
  * {
    -webkit-font-smoothing: antialiased;
  }
  .el-pagination.is-background {
    padding-right: 16px;
  }
  .el-pagination.is-background li {
    background: transparent;
    border: 1px solid $color-border-main;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #ffffff;
    border: 1px solid $color-border-main;
    font-size: 14px;
    color: $color-icon;

    &.is-active {
      background: $color-primary;
      color: #ffffff;
      border: 1px solid $color-primary;
      font-weight: normal;
      &:hover {
        background: $color-primary;
        color: #fff;
      }
    }
    &.more {
      border-color: transparent;
      &:hover {
        border-color: transparent;
      }
    }
    &:hover {
      color: $color-primary;
      border-color: $color-primary;
    }
    &:active {
      color: #2361e2;
      border-color: #2361e2;
    }
  }
  .el-pagination.is-background .btn-next,
  .el-pagination.is-background .btn-prev {
    background: transparent;
    .el-icon {
      display: flex;
    }
    &:disabled {
      .svg-icon {
        use {
          fill: #bfbfbf;
        }
      }
      &:hover {
        .svg-icon {
          use {
            fill: #bfbfbf;
          }
        }
      }
    }
    &:hover {
      .svg-icon {
        use {
          fill: $color-primary;
        }
      }
    }
  }
  .el-pagination__goto {
    color: #999;
    font-size: 14px;
    font-weight: initial;
  }
  .el-pagination__jump {
    margin-left: 11px;
    .el-input {
      width: 71px;
    }
    .el-input__wrapper {
      box-shadow: 0 0 0 1px$color-border-main inset;
      border-radius: 6px;
    }
  }
  .el-pagination__classifier {
    font-size: 14px;
    color: $color-icon;
  }
  .vxe-table .vxe-table--border-line {
    border-radius: 8px !important;
  }
}

.system-tab {
  .el-tabs__item {
    margin-right: 24px;
  }
  :deep() {
    .el-pager li {
      background: transparent;
      border: 1px solid $color-border-main;
    }
  }
}
.user-popover {
  box-shadow: 0px 4px 16px -6px rgba(0, 0, 0, 0.07);
  .ant-popover-inner {
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
    padding: 8px !important;
  }
}
</style>

<style lang="scss" scoped>
.task-split {
  width: 1px;
  height: 16px;
  margin: 0 12px 0 4px;
  background: #bfbfbf;
}
.task-input {
  width: 240px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(29, 116, 245, 0.08);
  box-shadow: none !important;
  border: 2px solid transparent !important;

  /* &:hover {
      background:$color-border-main !important;
      border: 2px solid $color-border-main !important;
    } */
  &.ant-input-affix-wrapper-focused {
    border: 2px solid #1d74f5 !important;
    background: none !important;

    :deep() {
      .ant-input-suffix {
        opacity: 1;
        pointer-events: auto;
      }
      .ant-input {
        color: rgba(0, 0, 0, 0.88) !important;
      }
    }
  }
  :deep() {
    .ant-input-suffix {
      opacity: 0;
      pointer-events: none;
    }
    .ant-input-clear-icon {
      color: rgba(0, 0, 0, 0.45);

      &:hover {
        color: rgba(0, 0, 0, 0.65);
      }
    }
    .ant-input {
      color: #1d74f5 !important;
    }
  }
}

.input-close {
  width: 24px;
  height: 24px;
  margin-left: 7px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
</style>
