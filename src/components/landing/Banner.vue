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
            <a href="javascript:;" @click="goHistory" @contextmenu.prevent>浏览历史</a>
            <a href="javascript:;" @click="showInDev" @contextmenu.prevent>收藏夹</a>
          </div>
        </div>
        <div class="about-settings">
          <div class="about-settings-title">
            <span>设置</span>
          </div>
          <div class="about-settings-link">
            <a href="javascript:;" @click="openThemeDialog" @contextmenu.prevent>主题</a>
            <a href="javascript:;" @click="openPrivacyDialog" @contextmenu.prevent>隐私</a>
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
              <a href="https://github.com/pwp-app/pixiviz/discussions" target="_blank">交流反馈</a>
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
    <ThemeDialog ref="theme" />
    <PrivacyDialog ref="privacy" />
  </div>
</template>

<script>
import { version } from '../../version.js';
import ThemeDialog from './dialogs/ThemeDialog';
import PrivacyDialog from './dialogs/PrivacyDialog';
import GitHubIcon from '../icons/github';

export default {
  name: 'Landing.Banner',
  components: {
    GitHubIcon,
    ThemeDialog,
    PrivacyDialog,
  },
  data() {
    return {
      expanded: false,
      expandLock: false,
      titleUp: false,
      aboutShow: false,
      clearMarginBottom: false,
      version,
      landingBgId: this.$config.landing_bg_id,
      landingBgName: this.$config.landing_bg_name,
    };
  },
  mounted() {
    if (window.FrontJS && typeof window.FrontJS.addUserData === 'function') {
      window.FrontJS.addUserData('appVer', version);
    }
  },
  beforeDestroy() {
    // reset to false
    this.$emit('expanded', false);
    this.$store.commit('landingBanner/setExpanded', false);
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
    openThemeDialog() {
      this.$refs.theme.open();
    },
    openPrivacyDialog() {
      this.$refs.privacy.open();
    },
    goHistory() {
      this.$router.push('/history');
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
