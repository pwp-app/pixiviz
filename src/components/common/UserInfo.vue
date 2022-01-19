<template>
  <el-dialog
    class="dialog dialog-user"
    title="Pixland 用户信息"
    :visible.sync="show"
    append-to-body
  >
    <div class="dialog-user-info">
      <div class="dialog-user-info__username">当前登录帐号: {{ username }}</div>
      <div class="dialog-user-info__action">
        <el-button type="primary" size="small" @click="openTransfer">继承</el-button>
        <el-button type="primary" size="small" @click="logout">登出</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      username: this.pixland.userStorage?.username || '',
    };
  },
  open() {
    this.username = this.pixland.userStorage?.username || '';
    this.show = true;
  },
};
</script>
