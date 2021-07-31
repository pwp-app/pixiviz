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
  </div>
</template>

<script>
import DownloadListTag from './components/common/DownloadListTag';
import DownloadList from './components/common/DownloadList';

export default {
  name: 'app',
  components: {
    DownloadList,
    DownloadListTag,
  },
  beforeCreate() {
    // 检测Safari
    window.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    // 检测standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      window.isStandAlone = true;
    }
    // 全局构建
    if (!window.pixiviz) {
      window.pixiviz = {};
    }
    // 设置全局map
    if (!window.pixiviz.infoMap) {
      window.pixiviz.infoMap = {};
    }
    // 重置图片-画师路由数据
    if (this.$route.path === '/') {
      window.localStorage.removeItem('pic-routes');
    }
    // Safari vh 优化
    if (window.isSafari && !window.isStandAlone) {
      const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      window.addEventListener('resize', setVh);
      setVh();
    }
  },
  created() {
    // 黑暗模式监听
    this.$bus.$on('dark-mode-enable', this.handleDarkModeEnable);
    this.$bus.$on('dark-mode-disable', this.handleDarkModeDisable);
    this.$bus.$on('save-loadmap', this.saveLoadMap);
    // 图片懒加载统一handle
    this.$Lazyload.$on('loaded', this.imageLoadedHandler);
    this.$Lazyload.$on('error', this.imageLoadErrorHandler);
    // rem fit
    this.fitHiRes();
    // log visit time
    window.localStorage.setItem('last-visit-time', Date.now());
  },
  mounted() {
    // add save loadmap listener
    window.addEventListener('resize', this.fitHiRes);
    window.addEventListener('beforeunload', this.cleanLoadMap);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.fitHiRes);
    window.removeEventListener('beforeunload', this.cleanLoadMap);
    window.localStorage.setItem('last-visit-time', Date.now());
  },
  computed: {
    showDownloadList() {
      return this.$store.state.download.list.length > 0;
    },
  },
  methods: {
    clearLoadMapSaveTimeout() {
      if (this.loadMapSaveTimeout) {
        clearTimeout(this.loadMapSaveTimeout);
        this.loadMapSaveTimeout = null;
      }
    },
    async saveLoadMap(immediate = false) {
      this.clearLoadMapSaveTimeout();
      if (immediate) {
        await this.$idb.set('load-map', this.$loadMap);
      } else {
        this.loadMapSaveTimeout = setTimeout(async () => {
          await this.$idb.set('load-map', this.$loadMap);
        }, 300);
      }
    },
    async cleanLoadMap() {
      const keys = Object.keys(this.$loadMap);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      keys.forEach((key) => {
        const item = this.$loadMap[key];
        if (new Date().valueOf() - item.time > threeDays) {
          delete this.$loadMap[key];
        }
      });
      await this.saveLoadMap();
    },
    // 图片加载处理
    imageLoadedHandler(e) {
      this.emitImageCardEvent({ ...e, eventType: 'loaded' });
    },
    imageLoadErrorHandler(e) {
      this.emitImageCardEvent({ ...e, eventType: 'error' });
    },
    emitImageCardEvent({ el, src, eventType }) {
      const type = el.getAttribute('data-type');
      if (type === 'card') {
        const matched = /(\d+)_p/.exec(src);
        if (!matched || matched.length < 1) return;
        const eventKey = `image-${eventType}-card-${el.getAttribute('data-index')}_${matched[1]}`;
        this.$bus.$emit(eventKey);
      } else if (type) {
        const id = el.getAttribute('id');
        this.$bus.$emit(`${type}-${id}-${eventType}`);
      }
    },
    // 黑暗模式监听
    handleDarkModeEnable() {
      this.$store.commit('darkMode/setEnabled', true);
    },
    handleDarkModeDisable() {
      this.$store.commit('darkMode/setEnabled', false);
    },
    // 高分屏适配
    fitHiRes() {
      if (window.innerWidth >= 1960 && window.innerHeight >= 1280) {
        if (window.innerWidth <= 2560) {
          document.documentElement.style.fontSize = '18px';
        } else {
          document.documentElement.style.fontSize = `${(window.innerWidth / 2330.0) * 16}px`;
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
