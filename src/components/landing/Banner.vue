<template>
  <div
    :class="['banner-wrapper',
      expanded ? 'banner-expanded' : '',
      clearMarginBottom ? 'clear-margin-bottom' : '']"
    @dblclick="handleDblClick"
    v-touch:doubletap="handleDoubleTap"
    >
    <div class="banner">
      <div :class="['banner-title', titleUp ? 'banner-title-up' : '']">
        <span>Pixiviz</span>
      </div>
      <div :class="['about', aboutShow ? 'about-show' : '']" v-show="expanded">
        <div class="about-borrow">
          <div class="about-borrow-title">
            <span>借物</span>
          </div>
          <div class="about-borrow-item">
            <span>Proxy: <a target="_blank" class="about-borrow-link" href="https://pixiv.cat">Pixivcat</a></span>
          </div>
          <div class="about-borrow-item">
            <span>主页背景: <a target="_blank" class="about-borrow-link" href="https://pixiviz.pwp.app/pic/86334188">▲富士山</a></span>
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
              active-text="深色"
              inactive-text="黑暗"
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
          <div class="about-copyright-item mobile-hide">
            <span>
              <a href="https://afdian.net/@backrunner" target="_blank">发电通道</a>
              <span class="about-copyright-split">|</span>
              <a href="javascript:;" id="wxdonate-trigger">
                <span>发电二维码</span>
                <DonateCode />
              </a>
              <span class="about-copyright-split">|</span>
              <a href="mailto:pixiviz@pwp.app">问题反馈</a>
              <span class="about-copyright-split">|</span>
              <a href="https://pwp.space" target="_blank">讨论交流</a>
            </span>
          </div>
          <div class="about-copyright-item">
            <span>v {{version}}</span>
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
import DonateCode from './DonateCode';

export default {
  name: "Landing.Banner",
  components: {
    GitHubIcon,
    DonateCode,
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
    }
  },
  created() {
    const darkEnabled = window.localStorage.getItem('enable-dark');
    this.darkmode = darkEnabled === 'true' ? true : false;
    const darkPersist = window.localStorage.getItem('dark-persist');
    this.darkPersist = darkPersist === 'true' ? true : false;
  },
  methods: {
    handleDblClick(e) {
      if (e.target.getAttribute('class') &&
        e.target.getAttribute('class').includes('el-switch')) {
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
      handleDblClick();
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
  },
};
</script>