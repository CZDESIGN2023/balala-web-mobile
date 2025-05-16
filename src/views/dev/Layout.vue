<script lang="ts" setup>
import { menus } from '@/views/dev/config'
</script>

<template>
  <div class="dev-layout">
    <div class="menu-bar">
      <router-link to="/" class="router-link">
        <el-link :underline="false">
          返回首页
        </el-link>
      </router-link>
      <template v-for="d in menus" :key="d.name">
        <router-link v-if="d.name" :to="d.path" class="router-link">
          <el-link :underline="false">
            {{ d.title }}
          </el-link>
        </router-link>
        <h4 v-else :underline="false">
          {{ d.title }}
        </h4>
      </template>
    </div>
    <div class="dev-wrapper">
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dev-layout {
  display: flex;
  max-width: 1440px;
  margin: 0 auto;
  height: 100vh;
}
.menu-bar {
  display: flex;
  flex-flow: column;
  width: 100px;
  height: 100%;
  overflow-y: auto;
  align-items: flex-start;
  padding: 16px 8px;
  :deep(.router-link-active) {
    .el-link {
      color: #409eff;
      background-color: rgba(64, 158, 255, 0.1);
    }
  }
  h4 {
    font-weight: bold;
    margin-top: 24px;
    margin-bottom: 8px;
  }
  .router-link {
    width: 100%;
  }
  .el-link {
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    justify-content: flex-start;
  }
}
:deep(.dev-wrapper) {
  padding: 16px 8px;
  flex: 1;
  line-height: 1.6;
  height: 100%;
  overflow-y: auto;
  h1 {
    margin-bottom: 32px;
  }
  h2 {
    font-size: 26.4px;
    margin-top: 36px;
    margin-bottom: 20px;
  }
  h3 {
    margin-top: 24px;
    font-size: 21.6px;
  }
  .showcase > p,
  > p {
    margin: 16px 0;
    code {
      font-size: 14px;
    }
  }
  li {
    list-style: circle;
    margin-left: 18px;
    font-size: 14px;
    line-height: 2;
  }
  code {
    background-color: #f5f7fa;
  }
}
</style>
