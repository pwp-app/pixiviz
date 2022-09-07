/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import Vue from 'vue';

// Import dependencies
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

// Import axios
import axios, { wrapAxios } from './util/axios';

// Import utils
import { getCachedConfig, setCacheConfig } from './util/config';
import { getOgTags } from './util/og';
import {
  defineProxyHosts,
  defineApiPrefix,
  checkAPIHostAlive,
  checkProxyHostAlive,
} from './util/line';
import bus from './util/bus';
import { registerThemeColorHandler } from './util/darkMode';

// Import sw
import './registerServiceWorker';

// Import pixland
import pixlandIns from './util/pixland';

import { initBaiduStat } from './util/statistics';
import { checkTrustHost } from './util/host';
import { getSensitiveWords } from './util/sensitiveWords';

Vue.prototype.$sensitiveWords = getSensitiveWords();

// Register handlers
registerThemeColorHandler();

const A_DAY_IN_MS = 24 * 60 * 60 * 1000;

// Set up pixland
Vue.prototype.pixland = pixlandIns;

Vue.config.productionTip = false;

// Set up config
const cachedConfig = getCachedConfig();
Vue.prototype.$config = Object.assign(config, cachedConfig);

const axiosIns = wrapAxios(axios, config);

Vue.prototype.axios = axiosIns;
Vue.prototype.$http = axiosIns;

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
Vue.prototype.$bus = bus;

// Set up idb
Vue.prototype.$idb = idb;

// Set up og tags
Vue.prototype.$ogTags = getOgTags();

// Get api pick storage

let disabledApiHost;

try {
  window.localStorage.getItem('pixiviz-api-disabled');
  if (disabledApiHost) {
    const hostStore = JSON.parse(disabledApiHost);
    if (new Date().valueOf() - hostStore.time >= A_DAY_IN_MS) {
      disabledApiHost = [];
      window.localStorage.removeItem('pixiviz-api-disabled');
    } else {
      disabledApiHost = disabledApiHost.hosts;
    }
  } else {
    disabledApiHost = [];
  }
} catch (err) {
  console.error('Failed to get disabled api host:', err);
  disabledApiHost = [];
}

let disabledProxyHost;

try {
  disabledProxyHost = window.localStorage.getItem('pixiviz-proxy-disabled');
  if (disabledProxyHost) {
    const hostStore = JSON.parse(disabledProxyHost);
    if (new Date().valueOf() - hostStore.time >= A_DAY_IN_MS) {
      disabledProxyHost = [];
      window.localStorage.removeItem('pixiviz-proxy-disabled');
    } else {
      disabledProxyHost = hostStore.hosts;
    }
  }
} catch (err) {
  console.error('Failed to get disabled proxy host:', err);
  disabledProxyHost = [];
}

const requestRemoteConfig = async () => {
  let res;
  try {
    res = await axios.get(config.remote_conf_url, {
      params: {
        t: Date.now(),
      },
      timeout: 5000,
    });
  } catch (err) {
    console.error('Failed to fetch remote configuration.', err);
    return;
  }
  const remoteConfig = res?.data;
  if (remoteConfig) {
    setCacheConfig(remoteConfig);
    Object.assign(config, remoteConfig);
  }
  if (typeof config.image_proxy_host === 'object') {
    defineProxyHosts(config.image_proxy_host, disabledProxyHost);
  }
  if (typeof config.download_proxy_host === 'object') {
    defineProxyHosts(config.download_proxy_host, disabledProxyHost);
  }
  // choose an API prefix
  defineApiPrefix(config, disabledApiHost);
  // add config to window
  window.pixiviz.config = config || {};
  // define a flag
  window.pixiviz.config.IS_REMOTE_CONFIG = true;
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
  defineProxyHosts(config.image_proxy_host, disabledProxyHost);
  defineProxyHosts(config.download_proxy_host, disabledProxyHost);
  defineApiPrefix(config, disabledApiHost);
  // render
  createInstance();
  // request remote
  if (!checkTrustHost(config)) {
    return;
  }
  try {
    await requestRemoteConfig();
    bus.$emit('remote-config-fetched');
    // compute hash
    const hash = await sha256(JSON.stringify(config));
    console.debug(`%cConfig hash: ${hash}`, 'color:#da7a85');
    console.debug(`%cConfig content: `, 'color:#da7a85', JSON.stringify(config));
    window.localStorage.setItem('remote_conf_hash', hash);
  } catch (e) {
    console.error('Request remote config error.', e);
  }
  // check api host alive
  try {
    checkAPIHostAlive(config);
    checkProxyHostAlive(config);
  } catch (e) {
    console.error('Smart line check failed.', e);
  }
};

// init stat
try {
  if (checkTrustHost(config)) {
    initBaiduStat();
  }
} catch (err) {
  console.error('Failed to init statistics script.', err);
}

execute();
