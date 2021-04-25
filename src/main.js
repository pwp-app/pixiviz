/* eslint-disable no-undef */
import Vue from 'vue';

// Import dependencies
import qs from 'qs';
import axios from 'axios';
import VueCookies from 'vue-cookies';
import VueLazyload from 'vue-lazyload';
import Vue2TouchEvents from 'vue2-touch-events';
import VueContextMenu from 'vue-context-menu';
import InfiniteLoading from 'vue-infinite-loading';

// Import config
import config from './config.json';

// Import element ui and styles

import './plugins/element';
import './styles/main.less';
import './util/extends';

// Import idb
import idb from './util/idb';

// Import store
import store from './store';

// Import view and router
import App from './App.vue';
import router from './router';

// Import sw
import './registerServiceWorker';

// frontjs intergration
if (process.env.NODE_ENV !== 'development') {
  import('./util/frontjs');
}

Vue.config.productionTip = false;

// Set up config
Vue.prototype.$config = config;

// Set up axios
axios.defaults.baseURL = '';
axios.defaults.withCredentials = false;
axios.defaults.timeout = 10000;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = [
  function(data) {
    return qs.stringify(data, {
      arrayFormat: 'brackets',
    });
  },
];

Vue.prototype.axios = axios;
Vue.prototype.$http = axios;

// Request remote config
axios
  .get('https://cfs.tigo.pwp.app/pixiviz-prod.json')
  .then((res) => {
    Object.assign(config, res.data);
    const proxyHosts = (hosts) => {
      if (typeof hosts === 'object') {
        const hostArr = Object.keys(hosts);
        hostArr.forEach((host, index) => {
          Object.defineProperty(hosts, index, {
            value: host,
            enumerable: false,
            writable: true,
            configurable: true,
          });
        });
      }
    };
    if (typeof config.image_proxy_host === 'object') {
      proxyHosts(config.image_proxy_host);
    }
    if (typeof config.download_proxy_host === 'object') {
      proxyHosts(config.download_proxy_host);
    }
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.warn('Failed to fetch remote configuration, use local values by default.');
  });

// Set up lazyload
Vue.use(VueLazyload, {
  // set observer to true
  observer: true,
  // optional
  observerOptions: {
    rootMargin: '0px',
    threshold: 0.1,
  },
});

// Mobile events
Vue.use(Vue2TouchEvents);

// Set up things for waterfall
Vue.use(InfiniteLoading, {
  slots: {
    noResults: '这里没有图片...',
    noMore: '没有更多图片了...',
  },
});

// Set up vue cookies
Vue.use(VueCookies);
Vue.$cookies.config('7d');

// Set up context menu
Vue.use(VueContextMenu, {
  useItem: true,
  mobileSupport: false,
});

// 获取下载设置
const downloadSettings = window.localStorage.getItem('download-settings');
if (downloadSettings) {
  try {
    Vue.prototype.$downloadSettings = JSON.parse(downloadSettings);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Cannot parse download settings.', err);
  }
} else {
  Vue.prototype.$downloadSettings = {
    singleFileName: '{title}-{id}',
    multiFileName: '{title}-{id}-{index}',
  };
}

// Set up bus
Vue.prototype.$bus = new Vue();

// Set up idb
Vue.prototype.$idb = idb;

// Set up loadmap
idb
  .get('loadMap')
  .then((loadMap) => {
    Vue.prototype.$loadMap = loadMap || {};
  })
  .catch(() => {
    Vue.prototype.$loadMap = {};
  })
  .finally(() => {
    new Vue({
      router,
      store,
      render: (h) => h(App),
      mounted() {
        document.dispatchEvent(new Event('render-event'));
      },
    }).$mount('#app');
  });
