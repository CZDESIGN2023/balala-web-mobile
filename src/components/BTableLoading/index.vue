<template>
  <div class="table-loading">
    <div class="box">
      <div class="line w2 h25" />
      <div class="dot w16 h16 br10" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-loading {
  width: 65px;
  height: 76px;
  background-color: $color-primary-active;
  border-radius: 30px 30px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, 0%);
  z-index: 1;
  .box {
    width: 16px;
    height: 41px;
    display: flex;
    margin-top: 10px;
    align-items: center;
    flex-direction: column;
    transform-origin: top;
    transform: rotate(0deg);
    animation: swing 1.5s infinite ease-in-out;
    .line {
      background: #333;
      border-radius: 10px;
    }
    .dot {
      background: #1ddff5;
      animation: changeColor 1.5s infinite ease-in-out;
    }
  }
}

@keyframes swing {
  0% {
    transform: rotate(35deg);
  }
  50% {
    transform: rotate(-35deg);
  }
  100% {
    transform: rotate(35deg);
  }
}

@keyframes changeColor {
  0% {
    background: #1ddff5;
  }
  30% {
    background: #1d74f5;
  }
  50% {
    background: #331df5;
  }
  70% {
    background: #331df5;
  }
  100% {
    background: #1ddff5;
  }
}
</style>
