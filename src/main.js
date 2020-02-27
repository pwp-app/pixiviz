import Vue from 'vue'

// Import dependencies
import qs from "qs"
import VueAxios from 'vue-axios'
import axios from 'axios';
import VueCookies from 'vue-cookies';
import VueLazyload from 'vue-lazyload'
import Vue2TouchEvents from 'vue2-touch-events'
import {VueMasonryPlugin} from 'vue-masonry';
import InfiniteLoading from 'vue-infinite-loading';

// Import element ui and styles

import './plugins/element.js'
import './styles/main.less';

// Import store
import store from './store';

// Import view and router
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

// Set up axios
axios.defaults.baseURL = ''
axios.defaults.withCredentials = true
axios.defaults.timeout = 15000
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded'
axios.defaults.transformRequest = [function (data) {
    return qs.stringify(data, {
        arrayFormat: 'brackets'
    })
}]

Vue.use(VueAxios, axios)

// Set up lazyload
Vue.use(VueLazyload)

// Mobile events
Vue.use(Vue2TouchEvents)

// Set up things for waterfall
Vue.use(VueMasonryPlugin)
Vue.use(InfiniteLoading, {
    slots: {
        noMore: '没有更多图片了...'
    },
})

// Set up vue cookies
Vue.use(VueCookies)
Vue.$cookies.config('7d');

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
