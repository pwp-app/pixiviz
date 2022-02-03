<template>
  <el-dialog
    class="dialog dialog-user"
    title="Pixland 用户信息"
    :visible.sync="show"
    append-to-body
  >
    <div class="dialog-user-base">
      <label>当前登录帐号</label>
      <div class="dialog-user-base__inner">
        <div class="dialog-user-base__username">
          <div class="username">{{ username }}</div>
        </div>
        <div class="dialog-user-base__action">
          <el-button type="primary" size="small" @click="openTransfer">继承至其他设备</el-button>
          <el-button type="primary" size="small" @click="logout">登出</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { logout as pixlandLogout } from '@/util/pixland';

export default {
  data() {
    return {
      show: false,
      username: this.pixland.userStorage?.username || '',
    };
  },
  methods: {
    open() {
      this.username = this.pixland.userStorage?.username || '';
      this.show = true;
    },
    openTransfer() {},
    async logout() {
      // wait for confirm
      try {
        await this.$confirm('您确定要登出当前的帐号吗？尚未同步的数据将会被清除，且无法恢复。', '确认');
      } catch {
        return;
      }
      pixlandLogout();
      this.show = false;
      this.$message.success('登出成功');
    },
  },
};
</script>
