<script lang="ts" setup></script>

<template>
  <h1>AvatarNameTag 头像昵称</h1>
  <h2>基本使用</h2>
  <p>最大完整显示宽度</p>
  <b-avatar-name-tag
    user-id="1"
    user-nickname="中文昵称"
  />

  <p>小宽度</p>
  <b-avatar-name-tag
    user-id="2"
    user-nickname="李狗蛋"
  />

  <p>超出宽度</p>
  <b-avatar-name-tag
    user-id="3"
    user-nickname="较长中文昵称"
  />

  <p>英文字符</p>
  <b-avatar-name-tag
    user-id="4"
    user-nickname="abcdefghijklm"
  />

  <p>带头像（url可能无效）</p>
  <b-avatar-name-tag
    user-id="5"
    user-nickname="abcdefghijklm"
    src="/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png"
  />

  <p>宽度不足（50px）</p>
  <div style="width: 50px;">
    <b-avatar-name-tag
      user-id="5"
      user-nickname="abcdefghijklm"
      src="/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png"
    />
  </div>

  <h2>关闭按钮</h2>
  <b-avatar-name-tag
    user-id="6"
    user-nickname="李狗蛋"
    closable
  />

  <h2>只有头像</h2>
  <b-avatar-name-tag
    user-id="6"
    user-nickname="李狗蛋"
    only-avatar
  />
</template>
