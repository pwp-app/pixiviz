import Vue from 'vue';
import VueRouter from 'vue-router';

import Landing from '../views/Landing.vue';
import Rank from '../views/Rank.vue';
import Pic from '../views/PicDetail.vue';
import Search from '../views/Search.vue';
import UserSearch from '../views/UserSearch.vue';
import Artist from '../views/Artist.vue';
import History from '../views/History.vue';
import NotFound from '../views/404.vue';
import { getOgTags, setOgTags } from '../util/og';
import config from '../config.json';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
    meta: {
      keepAlive: false,
      ogTagsData: {
        ogTitle: 'Pixiviz',
        ogDesc: '跨次元链接~，一个简单的二次元图片分享站',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}/favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: __ROOT_URL__,
      },
    },
  },
  {
    path: '/rank',
    name: 'Rank',
    component: Rank,
    meta: { keepAlive: true },
  },
  {
    path: '/pic/:id',
    name: 'Pic',
    component: Pic,
    meta: { keepAlive: false },
  },
  {
    path: '/artist/:id',
    name: 'Artist',
    component: Artist,
    meta: { keepAlive: true },
  },
  {
    path: '/search/:keyword',
    name: 'Search',
    component: Search,
    meta: { keepAlive: true },
  },
  {
    path: '/usearch/:keyword',
    name: 'UserSearch',
    component: UserSearch,
    meta: { keepAlive: true },
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    meta: {
      keepAlive: true,
      ogTagsData: {
        ogTitle: '浏览历史 - Pixiviz',
        ogDesc: '跨次元链接~，一个简单的二次元图片分享站',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: `${__ROOT_URL__}/history`,
      },
    },
  },
  {
    path: '/404',
    name: 'Page not found',
    component: NotFound,
    ogTagsData: {
      ogTitle: 'Not Found - Pixiviz',
      ogDesc: '跨次元链接~，一个简单的二次元图片分享站',
      // eslint-disable-next-line no-undef
      ogImage: `${config.website_url}/favicon.png`,
      // eslint-disable-next-line no-undef
      ogUrl: __ROOT_URL__,
    },
  },
  {
    path: '*',
    redirect: '/404',
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.afterEach((to) => {
  // check dark mode
  if (window.pixiviz) {
    if (window.pixiviz.darkEnabled && !window.pixiviz.darkPersist) {
      const hour = new Date().getHours();
      if (hour < 6 || hour >= 18) {
        Vue.prototype.$bus && Vue.prototype.$bus.$emit('dark-mode-enable');
        document.documentElement.classList.add('dark');
      } else if (document.documentElement.classList.contains('dark')) {
        Vue.prototype.$bus && Vue.prototype.$bus.$emit('dark-mode-disable');
        document.documentElement.classList.remove('dark');
      }
    }
  }
  // set og tags
  if (to.meta.ogTagsData) {
    setOgTags(getOgTags(), to.meta.ogTagsData);
  }
});

export default router;
