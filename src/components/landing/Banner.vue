<template>
  <div
    :class="[
      'banner-wrapper',
      {
        'banner-animating': animating,
        'banner-expanded': expanded,
        'clear-margin-bottom': clearMarginBottom,
      },
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
          </div>
          <div class="about-my-link">
            <a id="about-history" href="javascript:;" @click="goHistory" @contextmenu.prevent
              >浏览历史</a
            >
            <a href="javascript:;" @click="goCollection" @contextmenu.prevent>收藏夹</a>
            <a href="javascript:;" @click="showAccountDialog" @contextmenu.prevent>帐号</a>
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
          </div>
        </div>
        <div class="about-copyright">
          <div class="about-copyright-item">
            <span>&copy; 2025 pixiviz.xyz</span>
          </div>
          <div class="about-copyright-item">
            <span>
              <template v-if="showSponsor">
                <a href="https://pixiviz.xyz/sponsor" target="_blank">发电名录</a>
                <span class="about-copyright-split">|</span>
              </template>
              <a href="javascript:;" @click="openPrivacyDialog">隐私说明</a>
              <span class="about-copyright-split">|</span>
              <a :href="`https://pixiviz.xyz/pic/${landingBgId}`" target="_blank">主页背景</a>
            </span>
          </div>
          <div class="about-copyright-item">
            <span>v {{ appVer }}</span>
          </div>
          <template v-if="showGithub">
            <div class="about-copyright-item" @click="goGitHub">
              <GitHubIcon />
            </div>
          </template>
        </div>
      </div>
    </div>
    <ThemeDialog id="landing-dialog-theme" ref="theme" />
    <PrivacyDialog id="landing-dialog-privacy" ref="privacy" />
    <CommonLogin id="landing-dialog-login" ref="login" />
    <UserInfo id="landing-dialog-user" ref="user" />
  </div>
</template>

<script>
import { checkTrustHost } from '@/util/host';
import { version as appVer } from '../../version.js';
import ThemeDialog from './dialogs/ThemeDialog.vue';
import PrivacyDialog from './dialogs/PrivacyDialog.vue';
import CommonLogin from '../common/CommonLogin.vue';
import UserInfo from '../common/UserInfo.vue';
import GitHubIcon from '../icons/github';

const GITHUB_URL = 'https://github.com/pwp-app/pixiviz';

export default {
  name: 'Landing.Banner',
  components: {
    GitHubIcon,
    ThemeDialog,
    PrivacyDialog,
    CommonLogin,
    UserInfo,
  },
  computed: {
    showGithub() {
      return !!this.$config.show_github;
    },
    showSponsor() {
      return !!this.$config.show_sponsor;
    },
  },
  data() {
    return {
      animating: false,
      expanded: false,
      expandLock: false,
      titleUp: false,
      aboutShow: false,
      clearMarginBottom: false,
      appVer,
      landingBgId: this.$config.landing_bg_id,
    };
  },
  beforeDestroy() {
    // reset to false
    this.$emit('expanded', false);
    this.$store.commit('landingBanner/setExpanded', false);
  },
  methods: {
    performAnim() {
      if (!this.expandLock) {
        this.expandLock = true;
        if (!this.expanded) {
          this.expanded = true;
          // Hide scrollbar
          if (!document.documentElement.classList.contains('no-scrollbar')) {
            document.documentElement.classList.add('no-scrollbar');
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
                if (document.documentElement.classList.contains('no-scrollbar')) {
                  document.documentElement.classList.remove('no-scrollbar');
                }
              }, 500);
            }, 350);
          }, 350);
        } else {
          this.aboutShow = false;
          this.clearMarginBottom = false;
          // Hide scrollbar
          if (!document.documentElement.classList.contains('no-scrollbar')) {
            document.documentElement.classList.add('no-scrollbar');
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
                if (document.documentElement.classList.contains('no-scrollbar')) {
                  document.documentElement.classList.remove('no-scrollbar');
                }
              }, 500);
            }, 350);
          }, 350);
        }
      }
    },
    handleDblClick(e) {
      if (e.target.getAttribute('class') && e.target.getAttribute('class').includes('el-switch')) {
        return;
      }
      this.animating = true;
      setTimeout(() => {
        this.animating = false;
      }, 1300);
      // Banner Anim
      this.$forceUpdate();
      setTimeout(() => {
        this.performAnim();
      });
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
    goCollection() {
      this.$router.push('/collection');
    },
    goGitHub() {
      if (window.isSafari) {
        window.location.href = GITHUB_URL;
      } else {
        window.open(GITHUB_URL, '_blank');
      }
    },
    showAccountDialog() {
      if (!checkTrustHost(this.$config)) {
        this.$message.error('帐号功能暂不开放');
        return;
      }
      if (!this.pixland) {
        this.$message.error('Pixland 初始化失败，请刷新页面后再试');
        return;
      }
      if (!this.pixland.userStorage) {
        this.$refs.login?.open();
      } else {
        this.$refs.user?.open();
      }
    },
  },
};
</script>
