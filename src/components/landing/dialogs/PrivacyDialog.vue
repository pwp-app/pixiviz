<template>
  <el-dialog
    class="dialog dialog-privacy"
    title="隐私设置"
    :width="dialogWidth"
    :visible.sync="show"
    append-to-body
  >
    <el-form label-position="left" :label-width="labelWidth" :model="privacyForm">
      <el-form-item label="收集统计数据">
        <el-switch
          v-model="privacyForm.statistic"
          active-color="#E3A7A1"
          inactive-color="#3e3e3e"
          active-text="允许"
          inactive-text="禁止"
          @change="statChanged"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="收集遥测数据">
        <el-switch
          v-model="privacyForm.remote"
          active-color="#E3A7A1"
          inactive-color="#3e3e3e"
          active-text="允许"
          inactive-text="禁止"
          @change="remoteChanged"
        >
        </el-switch>
      </el-form-item>
    </el-form>
    <div class="dialog-privacy__tip">
      <span>
        您的数据可能会由百度统计、腾讯云 RUM 与 Cloudflare
        收集，这些数据均为匿名数据，有利于我们更好地运营、改进站点。
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
      privacyForm: {
        statistic: true,
        remote: true,
      },
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
    const privateStats = window.localStorage.getItem('privacy-statistic');
    this.privacyForm.statistic = privateStats !== 'false';
    const privacyRemote = window.localStorage.getItem('privacy-remote');
    this.privacyForm.remote = privacyRemote !== 'false';
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
    statChanged(value) {
      window.localStorage.setItem('privacy-statistic', value);
    },
    remoteChanged(value) {
      window.localStorage.setItem('privacy-remote', value);
    },
  },
};
</script>

<style lang="less">
.dialog-privacy {
  &__tip {
    margin-top: 24px;
    user-select: none;
    span {
      word-break: normal;
    }
  }
}
</style>
