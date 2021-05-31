/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import Vue from 'vue';

// Import dependencies
import qs from 'qs';
import axios from 'axios';
import VueCookies from 'vue-cookies';
import VueLazyload from 'vue-lazyload';
import Vue2TouchEvents from 'vue2-touch-events';
import VueContextMenu from 'vue-context-menu';
import InfiniteLoading from 'vue-infinite-loading';
import { sha256 } from 'hash-wasm';

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

// Import frontjs stat
import { initFrontJs } from './util/frontjs';

initFrontJs();

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
const bus = new Vue();
Vue.prototype.$bus = bus;

// Set up idb
Vue.prototype.$idb = idb;

const requestRemoteConfig = async () => {
  let res;
  try {
    res = await axios.get(config.remote_conf_url);
  } catch (err) {
    console.error('Failed to fetch remote configuration.', err);
    return;
  }
  Object.assign(config, res.data);
  const defineProxyHosts = (hosts) => {
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
    defineProxyHosts(config.image_proxy_host);
  }
  if (typeof config.download_proxy_host === 'object') {
    defineProxyHosts(config.download_proxy_host);
  }
};

const getLoadMap = async () => {
  // Set up loadmap
  let loadMap;
  try {
    loadMap = await idb.get('load-map');
  } catch (err) {
    console.error('Fetch loadmap error.', err);
  }
  const res = loadMap || {};
  Vue.prototype.$loadMap = res;
  if (process.env.NODE_ENV === 'development') {
    console.log('%cImages load map:', 'color:#da7185', res);
  }
  return res;
};

const createInstance = () => {
  new Vue({
    router,
    store,
    render: (h) => h(App),
    mounted() {
      document.dispatchEvent(new Event('render-event'));
    },
  }).$mount('#app');
};

// execute

getLoadMap().then(async (loadMap) => {
  createInstance();
  await requestRemoteConfig();
  // compare hash
  const storedHash = window.localStorage.getItem('remote_conf_hash');
  const hash = await sha256(JSON.stringify(config));
  // log
  console.log(`%cConfig hash: ${hash}`, 'color:#da7a85');
  if (process.env.NODE_ENV === 'development') {
    console.log(`%cConfig content: `, 'color:#da7a85', config);
  }
  if (!storedHash) {
    // init hash store
    window.localStorage.setItem('remote_conf_hash', hash);
    return;
  }
  if (hash !== storedHash) {
    // clear loadmap
    Object.keys(loadMap).forEach((key) => {
      loadMap[key] = null;
      delete loadMap[key];
    });
  }
});
