<script lang="ts" setup>
import { ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import type { UserListItem } from '@/api/interface'
import { AUTH_LIST } from '@/config'
import { getUserListBySearch } from '@/api/user'
import { debounce } from '@/utils'
import { useUserStore } from '@/stores/modules/user'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

interface Props {
  currentList: UserListItem[]
}

const props = withDefaults(defineProps<Props>(), {
  currentList: () => [],
})

const emits = defineEmits(['chooseItem'])

const { userInfo } = useUserStore()

// 是否显示 loading
const loading = ref<boolean>(false)
const memberList = ref<UserListItem[]>([])
const chooseList = ref<UserListItem[]>([])
const selectdList = ref<UserListItem[]>([])
const searchValue = ref('')
const visibleDropDown = ref(false)
const selectRef = ref()
const scrollbarRef = ref()
const recycleScroller = ref()
const currentItem = ref(0)

// 监听下拉展示
function dropdownVisibleChange(open: boolean) {
  if (open) {
    getMemberList('')
  }
}

// 选择权限
function chooseItemAuth(item: UserListItem, roleId: number) {
  item.dropdown = false
  item.roleId = Number(roleId)
}

async function getMemberList(keyword: string) {
  try {
    const { data } = await getUserListBySearch({ py: keyword })
    const filterList = data.list.filter(item => item.id !== String(userInfo.id))
    filterList.map((item) => {
      item.active = false
      item.roleId = 2
      props.currentList?.map((ytem) => {
        if (item.id === ytem.id) {
          item.active = ytem.active
          item.roleId = ytem.roleId
        }
      })
    })

    selectdList.value = props.currentList
    memberList.value = filterList
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
  finally {
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

const search = debounce(async (keyword: string) => {
  recycleScroller.value.scrollToPosition(0)
  getMemberList(keyword)
}, 100)

function changeInput(e: any) {
  searchValue.value = e.target.value
  search(e.target.value)
}

function chooseItem(item: UserListItem) {
  item.active = !item.active
  if (item.active && !selectdList.value.some(find => Number(find.id) === Number(item.id)))
    selectdList.value.push(item)

  memberList.value.map((item) => {
    selectdList.value.map((ytem) => {
      if (item.id === ytem.id)
        ytem.active = item.active
    })
  })

  const filterList = selectdList.value.filter(item => item.active)
  emits('chooseItem', filterList)
}

function clearInput() {
  searchValue.value = ''
  search('')
}

function testScroll(e: any) {
  scrollbarRef.value.scrollTo({ top: e.target.scrollTop })
}

function scroll(e: any) {
  if (memberList.value[currentItem.value].dropdown) {
    memberList.value[currentItem.value].dropdown = false
    currentItem.value = 0
  }
  selectRef.value?.focus()
  visibleDropDown.value = true
  recycleScroller.value.scrollToPosition(e.scrollTop)
}

function inputBlur() {
  visibleDropDown.value = false
  setTimeout(() => {
    searchValue.value = ''
  }, 300)
}
</script>

<template>
  <div class="b-input-select" :class="memberList.length > 0 ? 'border' : ''">
    <a-select
      ref="selectRef"
      v-model:value="chooseList"
      show-search
      allow-clear
      mode="multiple"
      :open="visibleDropDown"
      style="width: 100%"
      :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
      :auto-clear-search-value="false"
      :show-arrow="true"
      :search-value="searchValue"
      :dropdown-align="{ offset: [0, 8] }"
      placeholder="输入用户名或昵称"
      virtual
      @dropdown-visible-change="dropdownVisibleChange"
      @input="changeInput"
      @focus="visibleDropDown = true"
      @blur="inputBlur"
    >
      <template #suffixIcon>
        <svg-icon name="search" size="18" color="#333" />
      </template>
      <template #clearIcon>
        <a-tooltip title="清空" effect="dark">
          <img class="delete-icon w16" src="@/assets/svg/input-close.svg" @click="clearInput">
        </a-tooltip>
      </template>
      <template #dropdownRender>
        <div class="flex-row-between">
          <RecycleScroller
            ref="recycleScroller"
            class="r-scroller"
            style="width: 100%; height: 254px;"
            :items="memberList"
            :item-size="44"
            :buffer="30"
            :update-interval="5"
            key-field="id"
            @scroll="testScroll"
          >
            <template #empty>
              <div v-if="!memberList.length" class="flex-row-center empty-box">
                未找到与<span class="primary-color">&nbsp;“{{ searchValue }}”&nbsp;</span>相关的成员
              </div>
            </template>
            <template #default="{ item, index }">
              <div
                class="member-item flex-row-start"
                @click.prevent="chooseItem(item)"
              >
                <div class="info flex-one flex-row-start">
                  <div class="w40 flex-row-center">
                    <svg-icon
                      name="gou"
                      size="16"
                      color="#1D74F5"
                      :style="{ opacity: item.active ? 1 : 0 }"
                    />
                  </div>
                  <b-head
                    :id="item.id"
                    class="mr8"
                    width="28px"
                    :name="item.userNickname"
                    fs="text13"
                    :src="item?.avatar || ''"
                  />
                  <p class="nickname text14 mr8 short-name" :title="item.userNickname">
                    {{ item.userNickname }}
                  </p>
                  <p class="username text13 short-name">
                    {{ item.userName }}
                  </p>
                </div>
                <div class="tool flex-row-center">
                  <a-dropdown
                    v-model:open="item.dropdown"
                    :trigger="['click']"
                    :align="{ offset: [0, 8] }"
                    :get-popup-container="() => {
                      return recycleScroller.$el
                    }"
                    placement="bottomRight"
                    @click.stop="currentItem = index"
                  >
                    <div class="auth-btn flex-row-center">
                      {{ AUTH_LIST[item.roleId || 2].title
                      }}<svg-icon name="arrow-b" size="16" />
                    </div>
                    <template #overlay>
                      <div class="auth-list column-reverse">
                        <div
                          v-for="auth of AUTH_LIST"
                          :key="auth.id"
                          class="row pointer"
                          @click.stop="chooseItemAuth(item, auth.id)"
                        >
                          <p>{{ auth.title }}</p>
                          <span>{{ auth.desc }}</span>
                        </div>
                      </div>
                    </template>
                  </a-dropdown>
                </div>
              </div>
            </template>
          </RecycleScroller>
          <div style="width: 8px; position: absolute; top: 0; right: 0;">
            <el-scrollbar ref="scrollbarRef" style="width: 6px;" height="254" @scroll="scroll">
              <div class="w6" :style="{ height: `${memberList.length * 44}px` }" />
            </el-scrollbar>
          </div>
        </div>
      </template>
    </a-select>
  </div>
</template>

<style lang="scss" scoped>
.b-input-select {
  position: relative;
  :deep(.ant-select) {
    .ant-select-selector {
      width: 100%;
      min-height: 40px;
      background: $color-input;
      border: 0;
      border-radius: 6px;
      padding: 0 12px 0 30px;
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
      .ant-select-selection-search {
        // inset-inline-start: 38px;
        .ant-select-selection-search-input {
          height: 100%;
          caret-color: $color-primary;
          line-height: 40px;
          font-size: 14px;
        }
      }
      .ant-select-selection-placeholder {
        inset-inline-start: 38px;
        color: $color-minor;
        font-size: 14px;
      }
      .ant-select-selection-overflow {
        gap: 4px 8px;
        padding: 4px 8px;
        .ant-select-selection-search {
          margin-inline-start: 0;
        }
      }
    }
    .ant-select-arrow {
      left: 12px;
    }
    .ant-select-clear {
      width: 16px;
      height: 16px;
      margin-top: -8px;
      background: none;
    }
    &.ant-select-focused {
      .ant-select-selector {
        background: #fff;
        border: none !important;
        box-sizing: border-box;
        box-shadow: 0 0 0 1.6px $color-primary inset !important;
      }
    }
    .ant-select-dropdown {
      padding: 0px 0px;
      border: none;
      box-shadow: none;
      border-radius: 6px;
      .rc-virtual-list-holder-inner {
        flex-direction: row !important;
        flex-wrap: wrap;
        gap: 8px;
        .ant-select-item {
          padding: 0;
          cursor: pointer;
        }
        .ant-select-item-option-active {
          background-color: transparent;
        }
        .ant-select-item-option-state {
          opacity: 0;
          width: 0;
        }
        .ant-select-item-option-selected {
          background-color: transparent;
          .ant-select-item-option-content {
            .option-item {
              background: #e3f2ff;
              border: 1px solid #e3f2ff;
              font-weight: initial;
              p {
                color: $color-icon;
              }
            }
          }
        }
      }
    }
  }
  &.border {
    :deep(.ant-select) {
      .ant-select-dropdown {
        border: 1px solid #f4f5f7;
        box-shadow:
          0px 4px 24px 0px rgba(12, 20, 33, 0.01),
          0px 4px 4px 0px rgba(12, 20, 33, 0.02);
      }
    }
  }
}

.member-item {
  // padding: 10px 12px;
  height: 44px;
  transition: all 0.2s;
  position: relative;
  padding-right: 12px;
  cursor: pointer;
  .info {
    :deep(.el-checkbox) {
      height: auto;
      .el-checkbox__inner {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        &::after {
          left: 5px;
          top: 2px;
        }
      }
      // &.is-disabled {
      //   cursor: pointer;
      //   .el-checkbox__input.is-disabled {
      //     display: none;
      //   }
      //   .el-checkbox__label {
      //     padding-left: 0;
      //     cursor: pointer;
      //   }
      // }
    }
    :deep(.el-checkbox__label) {
      flex: 1;
      display: flex !important;
      align-items: center;
      justify-content: start;
    }
  }
  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $color-warning;
    color: #fff;
    font-size: 13px;
  }
  .nickname {
    color: $color-title;
    font-weight: initial;
    line-height: 16px;
  }
  .username {
    color: $color-minor;
    font-weight: initial;
    line-height: 16px;
  }
  .auth-btn {
    min-width: 68px;
    height: 24px;
    border-radius: 4px;
    padding: 4px 8px;
    background: $color-input;
    font-size: 12px;
    color: $color-icon;
    cursor: pointer;
    border: 1px solid $color-input;
  }

  .delete {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background: $color-bg-hover;
    }
  }
  &:last-child {
    &::after {
      display: none;
    }
  }
  &:hover {
    background: rgba($color: #000000, $alpha: 0.04);
    .auth-btn {
      background: #ffffff;
      border-color: $color-border-main;
    }
  }
  &:hover {
    background: $color-default-hover;
    .auth-btn {
      background: #ffffff;
      border-color: $color-border-main;
    }
  }
  &:active {
    background: $color-default-active;
  }
  // 隐藏下边框
  &.hideBorder {
    &::after {
      display: none;
    }
  }
  &.disabled {
    :deep(.el-checkbox) {
      .el-checkbox__input {
        display: none;
      }
      .el-checkbox__label {
        padding-left: 0;
        cursor: pointer;
      }
    }
  }
}

.empty-box {
  border: 1px solid #f4f5f7;
  box-shadow:
    0px 4px 24px 0px rgba(12, 20, 33, 0.01),
    0px 4px 4px 0px rgba(12, 20, 33, 0.02);
  border-radius: 6px;
  flex-wrap: wrap;
  text-align: center;
  min-height: 88px;
}

/*
  进入和离开动画
*/
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.column-reverse {
  display: flex;
  flex-direction: column-reverse;
}
.r-scroller {
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
