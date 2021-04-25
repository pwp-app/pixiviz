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
    // 全局构建
    if (!window.pixiviz) {
      window.pixiviz = {};
    }
    // 设置全局map
    if (!window.pixiviz.infoMap) {
      window.pixiviz.infoMap = {};
    }
    // 重置图片-画师路由数据
    window.localStorage.removeItem('pic-routes');
    // Safari vh 优化
    if (window.isSafari) {
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
    // 图片懒加载统一handle
    this.$Lazyload.$on('loaded', this.imageLoadedHandler);
    this.$Lazyload.$on('error', this.imageLoadErrorHandler);
  },
  mounted() {
    // add save loadmap listener
    window.addEventListener('beforeunload', this.saveLoadMap);
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.saveLoadMap);
  },
  computed: {
    showDownloadList() {
      return this.$store.state.download.list.length > 0;
    },
  },
  methods: {
    async saveLoadMap() {
      const keys = Object.keys(this.$loadMap);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      keys.forEach((key) => {
        const item = this.$loadMap[key];
        if (new Date().valueOf() - item.time > threeDays) {
          delete this.$loadMap[key];
        }
      });
      await this.$idb.set('load-map', this.$loadMap);
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
