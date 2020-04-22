import Vue from 'vue'
import VueRouter from 'vue-router'

// Import views
import Landing from '../views/Landing.vue'
import Rank from '../views/Rank.vue'
import Pic from '../views/PicDetail.vue'
import Search from '../views/Search.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'Landing',
    component: Landing,
    meta: { keepAlive: false }
}, {
    path: '/rank',
    name: 'Rank',
    component: Rank,
    meta: { keepAlive: true }
}, {
    path: '/pic/:id',
    name: 'Pic',
    component: Pic,
    meta: { keepAlive: false }
}, {
    path: '/search/:keyword',
    name: 'Search',
    component: Search,
    meta: { keepAlive: true }
}]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router