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
  </div>
</template>

<script>
import dayjs from 'dayjs';
import CONFIG from './config.json';
import DownloadListTag from './components/common/DownloadList';

export default {
  name: "app",
  components: {
    DownloadListTag,
  },
  beforeCreate() {
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
        // loadMap有效期30分钟
      } else if (loadMapTime && (new Date().valueOf() - loadMapTime) / 1000 > 1800) {
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
    // 重置entry-pic
    window.localStorage.removeItem('is-entry-pic');
    window.localStorage.removeItem('entry-pic-from');
  },
  created() {
    // 检测Safari
    window.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
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
      return this.$store.state.download.list.length > 1;
    }
  },
  methods: {
    saveLoadMap() {
      const keys = Object.keys(window.pixiviz.loadMap);
      const len = keys.length;
      if (!window.pixiviz.loadMap && len < 1) {
        return;
      }
      if (len > 500) {
        // loadMap最多只存500条数据，避免localStorage爆掉
        for (let i = 0; i < 500; i++) {
          delete window.pixiviz.loadMap[keys[len]];
        }
      }
      window.localStorage.setItem('loadmap', JSON.stringify(window.pixiviz.loadMap));
      window.localStorage.setItem('loadmap-save-time', new Date().valueOf());
    },
    // 图片加载处理
    imageLoadedHandler({ el, src }) {
      const type = el.getAttribute('data-type');
      if (type === 'card') {
        this.$bus.$emit(`image-loaded-card-${el.getAttribute('data-index')}`);
      }
    },
    imageLoadErrorHandler({ el, src }) {
      const type = el.getAttribute('data-type');
      if (type === 'card') {
        this.$bus.$emit(`image-error-card-${el.getAttribute('data-index')}`);
      }
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
