<template>
  <div
    :class="[
      'banner-wrapper',
      expanded ? 'banner-expanded' : '',
      clearMarginBottom ? 'clear-margin-bottom' : '',
    ]"
    @dblclick="handleDblClick"
    v-touch:doubletap="handleDoubleTap"
  >
    <div class="banner">
      <div :class="['banner-title', titleUp ? 'banner-title-up' : '']">
        <span>Pixiviz</span>
      </div>
      <div :class="['about', aboutShow ? 'about-show' : '']" v-show="expanded">
        <div class="about-my">
          <div class="about-my-title">
            <span>我的</span>
            <span class="indev">（开发中）</span>
          </div>
          <div class="about-my-link">
            <a href="javascript:;" @click="showInDev" @contextmenu.prevent>浏览历史</a>
            <a href="javascript:;" @click="showInDev" @contextmenu.prevent>收藏夹</a>
          </div>
        </div>
        <div class="about-theme">
          <div class="about-theme-title">
            <span>颜色主题</span>
          </div>
          <div class="about-theme-switch">
            <el-switch
              v-model="darkmode"
              active-color="#2e2e2e"
              inactive-color="#E3A7A1"
              active-text="黑暗"
              inactive-text="浅色"
              @change="themeChanged"
            >
            </el-switch>
          </div>
          <div class="about-theme-switch">
            <el-switch
              v-model="darkPersist"
              active-color="#2e2e2e"
              inactive-color="#3e3e3e"
              active-text="永久"
              inactive-text="自动"
              :disabled="!darkmode"
              @change="themeModeChanged"
            >
            </el-switch>
          </div>
        </div>
        <div class="about-copyright">
          <div class="about-copyright-item">
            <span>Copyright &copy; 2021 pwp.app.</span>
          </div>
          <div class="about-copyright-item">
            <span>
              <a href="https://afdian.net/@backrunner" target="_blank">发电通道</a>
              <span class="about-copyright-split">|</span>
              <a href="https://github.com/pwp-app/pixiviz/issues" target="_blank">问题反馈</a>
              <span class="about-copyright-split">|</span>
              <a :href="`https://pixiviz.pwp.app/pic/${landingBgId}`" target="_blank">主页背景</a>
            </span>
          </div>
          <div class="about-copyright-item">
            <span>v {{ version }}</span>
          </div>
          <div class="about-copyright-item" @click="goGitHub">
            <GitHubIcon />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { version } from '../../version.js';
import GitHubIcon from '../icons/github';

export default {
  name: 'Landing.Banner',
  components: {
    GitHubIcon,
  },
  data() {
    return {
      expanded: false,
      expandLock: false,
      titleUp: false,
      aboutShow: false,
      clearMarginBottom: false,
      version,
      darkmode: false,
      darkPersist: false, // 永久禁用
      landingBgId: this.$config.landing_bg_id,
      landingBgName: this.$config.landing_bg_name,
    };
  },
  created() {
    const darkEnabled = window.localStorage.getItem('enable-dark');
    this.darkmode = darkEnabled === 'true';
    const darkPersist = window.localStorage.getItem('dark-persist');
    this.darkPersist = darkPersist === 'true';
  },
  mounted() {
    if (window.FrontJS && typeof window.FrontJS.addUserData === 'function') {
      window.FrontJS.addUserData('appVer', version);
      window.FrontJS.addUserData('darkModeEnabled', this.darkmode);
      window.FrontJS.addUserData('darkModePersist', this.darkPersist);
    }
  },
  methods: {
    handleDblClick(e) {
      if (e.target.getAttribute('class') && e.target.getAttribute('class').includes('el-switch')) {
        return;
      }
      // Banner Anim
      if (!this.expandLock) {
        this.expandLock = true;
        if (!this.expanded) {
          this.expanded = true;
          // Hide scrollbar
          if (!document.body.classList.contains('no-scrollbar')) {
            document.body.classList.add('no-scrollbar');
          }
          this.$store.commit('landingBanner/setExpanded', this.expanded);
          this.$emit('expanded', true);
          setTimeout(() => {
            this.clearMarginBottom = true;
          }, 200);
          setTimeout(() => {
            this.titleUp = true;
            setTimeout(() => {
              this.aboutShow = true;
              setTimeout(() => {
                this.expandLock = false;
                // Reverse hiding scrollbar
                if (document.body.classList.contains('no-scrollbar')) {
                  document.body.classList.remove('no-scrollbar');
                }
              }, 500);
            }, 350);
          }, 350);
        } else {
          this.aboutShow = false;
          this.clearMarginBottom = false;
          // Hide scrollbar
          if (!document.body.classList.contains('no-scrollbar')) {
            document.body.classList.add('no-scrollbar');
          }
          this.$emit('expanded', false);
          setTimeout(() => {
            this.titleUp = false;
            setTimeout(() => {
              this.expanded = false;
              this.$store.commit('landingBanner/setExpanded', this.expanded);
              setTimeout(() => {
                this.expandLock = false;
                // Reverse hiding scrollbar
                if (document.body.classList.contains('no-scrollbar')) {
                  document.body.classList.remove('no-scrollbar');
                }
              }, 500);
            }, 350);
          }, 350);
        }
      }
    },
    handleDoubleTap() {
      this.handleDblClick();
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
    themeChanged(value) {
      if (value) {
        const now = dayjs();
        const hour = now.hour();
        if (!this.darkPersist) {
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
    goGitHub() {
      window.open('https://github.com/pwp-app/pixiviz');
    },
    // temp
    showInDev() {
      this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `
          <div class="oneline-notice">
            <span data-name="notice-indev">功能正在开发中，敬请期待</span>
          </div>`,
      });
    },
  },
};
</script>
