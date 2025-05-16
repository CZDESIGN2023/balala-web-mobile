<template>
  <van-floating-bubble
    axis="lock"
    icon="plus"
    magnetic="x"
    class="add-task-btn"
  >
    <svg-icon name="add" size="4.10256vw" color="#fff" />
  </van-floating-bubble>
</template>

<style lang="scss">
.add-task-btn {
  height: 48px;
  width: 48px;
  background: radial-gradient(44% 104% at 0% 32%, #009dff 0%, #3386ff 100%);
  backdrop-filter: blur(20px);
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.08);
  transform: none !important;
  right: 16px;
  bottom: 32px;
  left: auto;
  top: auto;
  // .a-button {
  //   width: 100%;
  //   height: 100%;
  //   border-radius: 6px;
  //   display: flex;
  //   flex-direction: row;
  //   justify-content: center;
  //   align-items: center;
  //   padding: 0px 20px;
  //   gap: 6px;
  //   background: radial-gradient(44% 104% at 0% 32%, #009dff 0%, #3386ff 100%);
  //   &:hover {
  //     background: radial-gradient(44% 104% at 0% 32%, #33b1ff 0%, #4d95ff 100%);
  //   }
  //   &:active {
  //     background: radial-gradient(44% 104% at 0% 32%, #0095f2 0%, #2e78e5 100%);
  //   }
  //   .svg-icon {
  //     flex-shrink: 0;
  //   }
  // }
}
</style>
