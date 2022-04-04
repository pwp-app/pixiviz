import Vue from 'vue';
import VueRouter from 'vue-router';
import Landing from '../views/Landing.vue';
import Rank from '../views/Rank.vue';
import Pic from '../views/PicDetail.vue';
import Search from '../views/Search.vue';
import UserSearch from '../views/UserSearch.vue';
import Artist from '../views/Artist.vue';
import History from '../views/History.vue';
import Collection from '../views/Collection.vue';
import AntiShare from '../views/AntiShare.vue';
import Sponsor from '../views/Sponsor.vue';
import NotFound from '../views/404.vue';
import { getOgTags, setOgTags } from '../util/og';
import config from '../config.json';
import { getShareToken } from '@/util/shareToken';

// suspend redirect error
const originalPush = VueRouter.prototype.push;

VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject);
  return originalPush.call(this, location).catch((err) => {
    if (VueRouter.isNavigationFailure(err)) {
      return err;
    }
    return Promise.reject(err);
  });
};

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
    meta: { keepAlive: false },
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
    path: '/collection',
    name: 'Collection',
    component: Collection,
    meta: {
      keepAlive: true,
      ogTagsData: {
        ogTitle: '收藏夹 - Pixiviz',
        ogDesc: '跨次元链接~，一个简单的二次元图片分享站',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: `${__ROOT_URL__}/collection`,
      },
    },
  },
  {
    path: '/sponsor',
    name: 'Sponsor',
    component: Sponsor,
    meta: {
      keepAlive: false,
      ogTagsData: {
        ogTitle: '感谢发电 - Pixiviz',
        ogDesc: '感谢每一位赞助了 Pixiviz 的用户',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: `${__ROOT_URL__}/sponsor`,
      },
    },
  },
  {
    path: '/anti-share',
    name: 'AntiShare',
    component: AntiShare,
    meta: {
      keepAlive: false,
      ogTagsData: {
        ogTitle: 'AntiShare - Pixiviz',
        ogDesc: '阻止恶意分享',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: `${__ROOT_URL__}/anti-share`,
      },
      ignoreShareToken: true,
    },
  },
  {
    path: '/404',
    name: 'Page not found',
    component: NotFound,
    meta: {
      ogTagsData: {
        ogTitle: 'Not Found - Pixiviz',
        ogDesc: '跨次元链接~，一个简单的二次元图片分享站',
        // eslint-disable-next-line no-undef
        ogImage: `${config.website_url}/favicon.png`,
        // eslint-disable-next-line no-undef
        ogUrl: __ROOT_URL__,
        ignoreShareToken: true,
      },
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

router.beforeEach((to, from, next) => {
  if (!to.meta?.ignoreShareToken && !to.query.st) {
    next({
      path: to.path,
      query: {
        ...to.query,
        st: getShareToken(),
      },
    });
  } else {
    next();
  }
});

router.afterEach((to) => {
  // check dark mode
  if (window.pixiviz) {
    if (window.pixiviz.darkEnabled && !window.pixiviz.darkPersist) {
      const hour = new Date().getHours();
      if (hour < 6 || hour >= 18) {
        Vue.prototype.$bus && Vue.prototype.$bus.$emit('dark-mode-enable');
      } else if (document.documentElement.classList.contains('dark')) {
        Vue.prototype.$bus && Vue.prototype.$bus.$emit('dark-mode-disable');
      }
    }
  }
  // set og tags
  if (to.meta.ogTagsData) {
    setOgTags(getOgTags(), to.meta.ogTagsData);
  }
});

export default router;
