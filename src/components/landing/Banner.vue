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
            <a id="about-history" href="javascript:;" @click="goHistory" @contextmenu.prevent
              >浏览历史</a
            >
            <a href="javascript:;" @click="showInDev" @contextmenu.prevent>收藏夹</a>
          </div>
        </div>
        <div class="about-settings">
          <div class="about-settings-title">
            <span>设置</span>
          </div>
          <div class="about-settings-link">
            <a id="about-theme" href="javascript:;" @click="openThemeDialog" @contextmenu.prevent
              >主题</a
            >
            <a
              id="about-privacy"
              href="javascript:;"
              @click="openPrivacyDialog"
              @contextmenu.prevent
              >隐私</a
            >
          </div>
        </div>
        <div class="about-copyright">
          <div class="about-copyright-item">
            <span>Copyright &copy; 2021 pwp.app.</span>
          </div>
          <div class="about-copyright-item">
            <span>
              <a href="https://pixiviz.pwp.app/sponsor" target="_blank">发电名录</a>
              <span class="about-copyright-split">|</span>
              <a href="https://github.com/pwp-app/pixiviz/discussions" target="_blank">交流反馈</a>
              <span class="about-copyright-split">|</span>
              <a :href="`https://pixiviz.pwp.app/pic/${landingBgId}`" target="_blank">主页背景</a>
            </span>
          </div>
          <div class="about-copyright-item">
            <span>v {{ appVer }}</span>
          </div>
          <div class="about-copyright-item" @click="goGitHub">
            <GitHubIcon />
          </div>
        </div>
      </div>
    </div>
    <ThemeDialog id="landing-dialog-theme" ref="theme" />
    <PrivacyDialog id="landing-dialog-privacy" ref="privacy" />
  </div>
</template>

<script>
import { version as appVer, buildTime as appBuildTime } from '../../version.js';
import ThemeDialog from './dialogs/ThemeDialog';
import PrivacyDialog from './dialogs/PrivacyDialog';
import GitHubIcon from '../icons/github';

const GITHUB_URL = 'https://github.com/pwp-app/pixiviz';

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
      appVer,
      landingBgId: this.$config.landing_bg_id,
    };
  },
  mounted() {
    window.aegis &&
      window.aegis.setConfig({
        ext1: appVer,
        ext2: appBuildTime,
      });
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
      if (window.isSafari) {
        window.location.href = GITHUB_URL;
      } else {
        window.open(GITHUB_URL, '_blank');
      }
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
