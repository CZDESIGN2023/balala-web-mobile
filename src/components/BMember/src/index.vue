<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { UserListItem } from '@/api/interface'
import { useProjectStore } from '@/stores/modules/project'
import { deepCopy } from '@/utils'

const emits = defineEmits(['onGetMemberList'])
const projectStore = useProjectStore()
const dialogVisible = ref<boolean>(false)
const list = ref<UserListItem[]>([])
const memberAllList = computed(() => projectStore.memberList)

// 添加项目成员弹框
function openMemberPop() {
  dialogVisible.value = true
}

// 添加成员
function chooseItem(arr: UserListItem[]) {
  const filterArr = arr.filter(item => item.active)
  list.value = filterArr
}

// 移除单个成员
function deleteItem(item: UserListItem) {
  const filterArr = list.value.filter(ytem => ytem.id !== item.id)
  list.value = filterArr
}

// 修改单个成员(权限)
function editItemRole() {
  emits('onGetMemberList', list.value)
}

// 批量添加成员
function onConfirmAdd(arr: UserListItem[]) {
  const newArr = deepCopy(arr)
  list.value = newArr
}

// 监听列表变化
watch(list, () => {
  emits('onGetMemberList', list.value)
})
</script>

<template>
  <div id="member-box" class="member-box">
    <div class="pl12 pr12">
      <b-input-select :current-list="list" @choose-item="chooseItem" />
      <div class="tools flex-row-between">
        <p class="member-num">
          已添加 {{ list.length }} 位成员
        </p>
        <p class="member-add" @click="openMemberPop">
          添加项目成员
        </p>
      </div>
    </div>
    <div class="member-list">
      <b-empty
        v-if="list.length === 0"
        desc="当前暂无成员，请添加"
        pt="142px"
        desc-color="#bfbfbf"
      />
      <b-member-list
        v-else
        :list="list"
        :show-auth="true"
        type="b-member"
        @delete-item="deleteItem"
        @edit-item-role="editItemRole"
      />
    </div>
  </div>
  <b-member-dialog
    :is-create="true"
    :dialog-visible="dialogVisible"
    :current-list="list"
    @on-confirm="onConfirmAdd"
    @on-close="dialogVisible = false"
  />
</template>

<style lang="scss" scoped>
.member-box {
  width: 100%;
  height: 389px;
  border-radius: 6px;
  padding: 12px 0;
  background: #ffffff;
  border: 1px solid #edeef0;
  &:hover {
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
  }
  .tools {
    height: 37px;
    .member-num {
      font-size: 13px;
      font-weight: initial;
      color: $color-minor;
    }
    .member-add {
      font-size: 13px;
      font-weight: initial;
      color: $color-primary;
      cursor: pointer;
    }
  }
}
</style>
