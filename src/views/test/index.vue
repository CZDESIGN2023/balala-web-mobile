<script lang="ts" setup>
</script>

<template>
  <div class="box">
    这是一个宽度为375px的盒子
  </div>

  <div class="pt24 gap20 flex-row-start">
    <CZButton>
      默认按钮
    </CZButton>
    <CZButton plain>
      描边按钮
    </CZButton>
    <CZButton type="primary">
      主要按钮
    </CZButton>
    <CZButton type="success">
      成功按钮
    </CZButton>
    <CZButton type="warning">
      警告按钮
    </CZButton>
    <CZButton type="danger">
      危险按钮
    </CZButton>
    <CZButton type="text">
      文本按钮
    </CZButton>
    <CZButton tag="a" type="link">
      链接按钮
    </CZButton>
  </div>
  <div class="pt24 gap20 flex-row-start">
    <CZButton disabled>
      默认按钮
    </CZButton>
    <CZButton plain disabled>
      描边按钮
    </CZButton>
    <CZButton disabled type="primary">
      主要按钮
    </CZButton>
    <CZButton disabled type="success">
      成功按钮
    </CZButton>
    <CZButton disabled type="warning">
      警告按钮
    </CZButton>
    <CZButton disabled type="danger">
      危险按钮
    </CZButton>
    <CZButton disabled type="text">
      文本按钮
    </CZButton>
    <CZButton disabled tag="a" type="link">
      链接按钮
    </CZButton>
  </div>
  <hr>
  <div class="pt24 gap20 flex-row-start">
    <CZButton type="primary" size="large">
      大型按钮
    </CZButton>
    <CZButton type="primary" size="normal">
      中型按钮
    </CZButton>
    <CZButton type="primary" size="small">
      小型按钮
    </CZButton>
  </div>
</template>

<style lang="scss">
.box {
  width: 375px; /* 在构建后会转换为vw单位 */
  height: 100px;
  font-size: 28px;
}
</style>
