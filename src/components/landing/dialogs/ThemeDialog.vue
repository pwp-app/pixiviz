<template>
  <el-dialog
    class="dialog dialog-theme"
    title="颜色主题设置"
    :width="dialogWidth"
    :visible.sync="show"
    append-to-body
  >
    <el-form label-position="left" :label-width="labelWidth" :model="themeForm">
      <el-form-item label="颜色主题">
        <el-switch
          v-model="themeForm.darkMode"
          active-color="#2e2e2e"
          inactive-color="#E3A7A1"
          active-text="暗色"
          inactive-text="浅色"
          @change="themeChanged"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="模式">
        <el-switch
          v-model="themeForm.darkPersist"
          active-color="#2e2e2e"
          inactive-color="#3e3e3e"
          active-text="固定颜色"
          inactive-text="自动切换"
          :disabled="!themeForm.darkMode"
          @change="themeModeChanged"
        >
        </el-switch>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import dayjs from 'dayjs';
import settingsDialog from '../../../mixin/settingDialog';

export default {
  data() {
    return {
      show: false,
      themeForm: {
        darkMode: false,
        darkPersist: false, // 永久禁用
      },
      screenWidth: document.documentElement.clientWidth,
    };
  },
  mixins: [settingsDialog],
  computed: {
    labelWidth() {
      if (this.screenWidth <= 320) {
        return '72px';
      } else {
        return '80px';
      }
    },
  },
  created() {
    window.addEventListener('resize', this.windowResized);
    const darkEnabled = window.localStorage.getItem('enable-dark');
    this.themeForm.darkMode = darkEnabled === 'true';
    const darkPersist = window.localStorage.getItem('dark-persist');
    this.themeForm.darkPersist = darkPersist === 'true';
  },
  methods: {
    open() {
      this.show = true;
    },
    themeChanged(value) {
      if (value) {
        const now = dayjs();
        const hour = now.hour();
        if (!this.themeForm.darkPersist) {
          if (hour < 6 || hour >= 18) {
            this.addDarkClass();
          }
        } else {
          this.addDarkClass();
        }
      } else {
        this.removeDarkClass();
      }
      window.pixiviz.darkEnabled = value;
      window.localStorage.setItem('enable-dark', value);
    },
    themeModeChanged(value) {
      if (value) {
        // 永久黑暗模式
        this.addDarkClass();
      } else {
        // 自动黑暗模式
        const now = dayjs();
        const hour = now.hour();
        if (hour >= 6 && hour < 18) {
          this.removeDarkClass();
        }
      }
      window.pixiviz.darkPersist = value;
      window.localStorage.setItem('dark-persist', value);
    },
    addDarkClass() {
      if (!document.documentElement.classList.contains('dark')) {
        this.$bus.$emit('dark-mode-enable');
        document.documentElement.classList.add('dark');
      }
    },
    removeDarkClass() {
      if (document.documentElement.classList.contains('dark')) {
        this.$bus.$emit('dark-mode-disable');
        document.documentElement.classList.remove('dark');
      }
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
  },
};
</script>
