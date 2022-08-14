<template>
  <div id="app">
    <transition mode="out-in">
      <keep-alive v-if="$route.meta.keepAlive">
        <router-view></router-view>
      </keep-alive>
      <router-view v-else></router-view>
    </transition>
    <transition-group
      class="right-tag-wrapper"
      mode="out-in"
      enter-active-class="right-tag-in"
      leave-to-class="right-tag-out"
    >
      <DownloadListTag key="downloadList" v-if="showDownloadList" />
    </transition-group>
    <DownloadList />
    <Maintain :text="maintainText" ref="maintain" />
  </div>
</template>

<script>
import DownloadListTag from './components/common/DownloadListTag';
import DownloadList from './components/common/DownloadList';
import Maintain from './components/common/Maintain.vue';
import { isWeChat } from './util/device';
import { bottomNotify } from './util/notify';
import { syncData as syncPixlandData } from './util/pixland';
import { loadGoogleFont } from './util/gfont';

export default {
  name: 'app',
  components: {
    DownloadList,
    DownloadListTag,
    Maintain,
  },
  data() {
    return {
      maintainText: '',
    };
  },
  beforeCreate() {
    // test safari
    window.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    // test standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      window.isStandAlone = true;
    }
    if (!window.pixiviz) {
      window.pixiviz = {};
    }
    // set global info map
    if (!window.pixiviz.infoMap) {
      window.pixiviz.infoMap = {};
    }
    // reset pic-artist router data
    if (this.$route.path === '/') {
      window.localStorage.removeItem('pic-routes');
    }
    // Safari vh optimization
    if (window.isSafari && !window.isStandAlone) {
      const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      window.addEventListener('resize', setVh);
      setVh();
    }
    // lazy load the google fonts
    loadGoogleFont();
  },
  created() {
    // st check
    if (!this.$route.query.st && this.$route.path === '/' && isWeChat()) {
      this.$router.replace({
        path: '/anti-share',
      });
      return;
    }
    // listen bus events
    this.$bus.$on('user-not-online', () => {
      bottomNotify('warn', '电波讯号中断，请检查您的网络连接', 3000);
    });
    this.$bus.$on('api-not-available', () => {
      bottomNotify('warn', '电波失联，我们暂时无法连接至服务器...', 3000);
    });
    this.$bus.$on('proxy-not-available', () => {
      bottomNotify('warn', '电波失联，我们暂时无法连接至图片服务器...', 3000);
    });
    // listen darkmode events
    this.$bus.$on('dark-mode-enable', this.handleDarkModeEnable);
    this.$bus.$on('dark-mode-disable', this.handleDarkModeDisable);
    // handle lazyload imgs
    this.$Lazyload.$on('loaded', this.imageLoadedHandler);
    this.$Lazyload.$on('error', this.imageLoadErrorHandler);
    // rem fit
    this.fitHiRes();
    // log visit time
    window.localStorage.setItem('last-visit-time', Date.now());
    // sync user data
    if (this.pixland?.isLogin() && !this.$config.pixland?.maintain) {
      syncPixlandData();
    }
  },
  mounted() {
    // listen remote config fetched event
    this.$bus.$once('remote-config-fetched', () => {
      this.$nextTick(() => {
        this.checkMaintain();
      });
    });
    this.checkMaintain();
    // add window listener
    window.addEventListener('resize', this.fitHiRes);
    // vconsole
    if (this.$route.query.debug === '1') {
      const vconsole = document.createElement('script');
      vconsole.src = 'https://unpkg.com/vconsole/dist/vconsole.min.js';
      vconsole.onload = () => {
        // eslint-disable-next-line no-new
        new window.VConsole();
      };
      document.body.appendChild(vconsole);
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.fitHiRes);
    window.localStorage.setItem('last-visit-time', Date.now());
  },
  computed: {
    showDownloadList() {
      return this.$store.state.download.list.length > 0;
    },
  },
  methods: {
    checkMaintain() {
      const { maintain } = this.$config;
      if (this.$config.maintain?.enable) {
        this.$refs.maintain.show();
        this.maintainText = maintain.text;
        document.documentElement.classList.add('no-scrollbar');
      }
    },
    // image load handlers
    imageLoadedHandler(e) {
      this.emitImageCardEvent({ ...e, eventType: 'loaded' });
    },
    imageLoadErrorHandler(e) {
      this.emitImageCardEvent({ ...e, eventType: 'error' });
    },
    emitImageCardEvent({ el, src, eventType }) {
      const type = el.getAttribute('data-type');
      if (type === 'card') {
        const matched = /(\d+)_[a-z0-9_]+\.jpg$/.exec(src);
        if (!matched || matched.length < 1) return;
        const eventKey = `image-${eventType}-card-${el.getAttribute('data-index')}_${matched[1]}`;
        this.$bus.$emit(eventKey);
      } else if (type) {
        const id = el.getAttribute('id');
        this.$bus.$emit(`${type}-${id}-${eventType}`);
      }
    },
    // dark mode events
    handleDarkModeEnable() {
      this.$store.commit('darkMode/setEnabled', true);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#161616');
      }
    },
    handleDarkModeDisable() {
      this.$store.commit('darkMode/setEnabled', false);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#fafafa');
      }
    },
    // high resolution screen fit
    fitHiRes() {
      if (window.innerWidth >= 1960 && window.innerHeight >= 1280) {
        if (window.innerWidth <= 2560) {
          document.documentElement.style.fontSize = '16.75px';
        } else {
          document.documentElement.style.fontSize = `${(window.innerWidth / 2560) * 16.75}px`;
        }
      }
    },
  },
};
</script>

<style>
.v-enter {
  opacity: 0;
}
.v-enter-active {
  transition: 200ms;
}
.v-enter-to {
  opacity: 1;
}
.v-leave {
  opacity: 1;
}
.v-leave-to {
  opacity: 0;
}
.v-leave-active {
  transition: 200ms;
}
</style>
