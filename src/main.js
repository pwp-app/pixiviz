/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

// Import dependencies
import VueCookies from 'vue-cookies';
import VueLazyload from 'vue-lazyload';
import Vue2TouchEvents from 'vue2-touch-events';
import VueContextMenu from 'vue-context-menu';
import InfiniteLoading from 'vue-infinite-loading';
import seedrandom from 'seedrandom';
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

// Import axios
import axios from './util/axios';

// Import utils
import { getOgTags } from './util/og';
import { weightedRandom } from './util/random';

// Import sw
import './registerServiceWorker';

// Import frontjs stat
import { initBaiduStat, initFrontJs } from './util/statistics';
import { checkTrustHost } from './util/host';

// constants
const API_PREFIX_STORE_KEY = 'pixiviz-api-prefix';

Vue.use(VueCompositionAPI);

if (checkTrustHost(config)) {
  initBaiduStat();
  initFrontJs();
}

Vue.config.productionTip = false;

// Set up config
Vue.prototype.$config = config;

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

// Set up og tags
Vue.prototype.$ogTags = getOgTags();

const storedApiPrefix = window.localStorage.getItem(API_PREFIX_STORE_KEY);

const defineProxyHosts = (hosts) => {
  if (typeof hosts !== 'object') {
    return;
  }
  const hostArr = Object.keys(hosts);
  let hostIdxList = [];
  hostArr.forEach((host, index) => {
    Object.defineProperty(hosts, index, {
      value: host,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    const weight = hosts[host] * 100;
    hostIdxList = hostIdxList.concat(new Array(Math.floor(weight)).fill(index));
  });
  // use seedrandom to ensure the sequence
  const rng = seedrandom('pixiviz');
  hostIdxList.sort(() => 0.5 - rng.quick());
  Object.defineProperty(hosts, 'idxList', {
    value: hostIdxList,
    enumerable: false,
    writable: true,
    configurable: true,
  });
};

const defineApiPrefix = (conf) => {
  if (Array.isArray(conf.api_prefix)) {
    if (storedApiPrefix && conf.api_prefix.includes(storedApiPrefix)) {
      conf.api_prefix = storedApiPrefix;
      return;
    }
    // choose one randomly
    const weight = 1.0 / conf.api_prefix.length;
    const spec = {};
    conf.api_prefix.forEach((prefix) => {
      spec[prefix] = weight;
    });
    const [prefix] = weightedRandom(spec);
    conf.api_prefix = prefix;
    window.localStorage.setItem(API_PREFIX_STORE_KEY, prefix);
  } else {
    window.localStorage.setItem(API_PREFIX_STORE_KEY, conf.api_prefix);
  }
};

const requestRemoteConfig = async () => {
  let res;
  try {
    res = await axios.get(config.remote_conf_url);
  } catch (err) {
    console.error('Failed to fetch remote configuration.', err);
    return;
  }
  Object.assign(config, res.data);
  if (typeof config.image_proxy_host === 'object') {
    defineProxyHosts(config.image_proxy_host);
  }
  if (typeof config.download_proxy_host === 'object') {
    defineProxyHosts(config.download_proxy_host);
  }
  // choose an API prefix
  defineApiPrefix(config);
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

const execute = async () => {
  // for default
  defineProxyHosts(config.image_proxy_host);
  defineProxyHosts(config.download_proxy_host);
  defineApiPrefix(config);
  // render
  createInstance();
  // request remote
  if (!checkTrustHost(config)) {
    return;
  }
  await requestRemoteConfig();
  // compute hash
  const hash = await sha256(JSON.stringify(config));
  // log
  console.log(`%cConfig hash: ${hash}`, 'color:#da7a85');
  if (process.env.NODE_ENV === 'development') {
    console.log(`%cConfig content: `, 'color:#da7a85', config);
  }
  window.localStorage.setItem('remote_conf_hash', hash);
};

execute();
