<template>
  <el-dialog
    class="dialog dialog-privacy"
    title="隐私说明"
    :width="dialogWidth"
    :visible.sync="show"
    append-to-body
  >
    <div class="dialog-privacy__tip">
      <span>
        您的数据可能会被 Cloudflare 收集，这些数据均为匿名数据，主要用于访问分析和安全审查。
        <br><br>
        您的同步数据全程使用 https 进行传输，通过端到端加密保证数据安全性。
        <br><br>
        您是唯一有权访问该同步数据的人，您的数据不会以任何方式泄露给任何人，您的密码是访问数据的唯一凭证。
      </span>
    </div>
  </el-dialog>
</template>

<script>
import settingsDialog from '../../../mixin/settingDialog';

export default {
  data() {
    return {
      show: false,
      screenWidth: document.documentElement.clientWidth,
    };
  },
  mixins: [settingsDialog],
  computed: {
    labelWidth() {
      if (this.screenWidth <= 320) {
        return '108px';
      } else {
        return '120px';
      }
    },
  },
  created() {
    window.addEventListener('resize', this.windowResized);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.windowResized);
  },
  methods: {
    open() {
      this.show = true;
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
  },
};
</script>

<style lang="less">
.dialog-privacy {
  &__tip {
    user-select: none;

    span {
      word-break: normal;
    }
  }
}
</style>
