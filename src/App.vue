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
      <DownloadListTag key="downloadList" v-if="showDownloadList"/>
    </transition-group>
    <DownloadList />
  </div>
</template>

<script>
import dayjs from 'dayjs';
import CONFIG from './config.json';
import DownloadListTag from './components/common/DownloadListTag';
import DownloadList from './components/common/DownloadList';

const LOADMAP_ENTRIES_LIMIT = 1000;
const LOADMAP_DELETE_RATE = 0.5;

export default {
  name: "app",
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
    // 初始化图片负载表
    if (!window.pixiviz.loadMap) {
      const loadMap = JSON.parse(window.localStorage.getItem('loadmap'));
      const loadMapTime = window.localStorage.getItem('loadmap-save-time');
      if (!loadMap || !loadMapTime) {
        window.pixiviz.loadMap = {};
        // loadMap有效期1天
      } else if (loadMapTime && (new Date().valueOf() - loadMapTime) / 1000 > 24 * 3600) {
        window.pixiviz.loadMap = {};
        window.localStorage.removeItem('loadmap');
      } else if (loadMap) {
        window.pixiviz.loadMap = loadMap;
      }
    }
    // 异步获取分流配置
    this.axios.get('https://config.backrunner.top/pixiviz/proxy-config.json', {
      withCredentials: false,
    }).then((res) => {
      if (res.data) {
        let index = 0;
        window.pixiviz.hostMap = {};
        Object.keys(res.data).forEach((key) => {
          window.pixiviz.hostMap[index] = key;
          window.pixiviz.hostMap[key] = index;
          index++;
        });
        window.pixiviz.proxyMap = res.data;
      }
    }, () => {
      console.log('Cannot fetch proxy config.');
    });
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
  destroyed() {
    window.removeEventListener('beforeunload', this.saveLoadMap);
  },
  computed: {
    showDownloadList() {
      return this.$store.state.download.list.length > 0;
    }
  },
  methods: {
    saveLoadMap() {
      const keys = Object.keys(window.pixiviz.loadMap);
      const len = keys.length;
      if (!window.pixiviz.loadMap && len < 1) {
        return;
      }
      if (len > LOADMAP_ENTRIES_LIMIT) {
        // 限制loadMap大小，避免localStorage爆掉
        const deleteCount = Math.floor(LOADMAP_ENTRIES_LIMIT * LOADMAP_DELETE_RATE);
        for (let i = 0; i < deleteCount; i++) {
          delete window.pixiviz.loadMap[keys[i]];
        }
      }
      window.localStorage.setItem('loadmap', JSON.stringify(window.pixiviz.loadMap));
      window.localStorage.setItem('loadmap-save-time', new Date().valueOf());
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
      }
    },
    // 黑暗模式监听
    handleDarkModeEnable() {
      this.$store.commit('darkMode/setEnabled', true);
    },
    handleDarkModeDisable() {
      this.$store.commit('darkMode/setEnabled', false);
    }
  }
}
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
