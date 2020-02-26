import Vue from 'vue'
import App from './App.vue'
import router from './router'
import qs from "qs"
import VueAxios from 'vue-axios'
import axios from 'axios';
import VueLazyload from 'vue-lazyload'
import VueBus from 'vue-bus'
import './plugins/element.js'
import './styles/main.less';

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

// Set up vue-bus
Vue.use(VueBus)

// Set up lazyload
Vue.use(VueLazyload)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
