import Vue from "vue";
import VueRouter from "vue-router";

import Landing from '../views/Landing.vue';
import Rank from '../views/Rank.vue';
import Pic from '../views/PicDetail.vue';
import Search from '../views/Search.vue';
import Artist from '../views/Artist.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Landing",
    component: Landing,
    meta: { keepAlive: false },
  },
  {
    path: "/rank",
    name: "Rank",
    component: Rank,
    meta: { keepAlive: true },
  },
  {
    path: "/pic/:id",
    name: "Pic",
    component: Pic,
    meta: { keepAlive: false },
  },
  {
    path: "/artist/:id",
    name: "Artist",
    component: Artist,
    meta: { keepAlive: true },
  },
  {
    path: "/search/:keyword",
    name: "Search",
    component: Search,
    meta: { keepAlive: true },
  },
  {
    path: "/404",
    name: "Page not found",
    component: () => import(/* webpackChunkName: "group-lazy" */ "../views/404.vue"),
  },
  {
    path: "*",
    redirect: "/404"
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.afterEach(() => {
  if (window.MtaH5) {
    window.MtaH5.pgv();
  }
  // check dark mode
  if (window.pixiviz) {
    if (window.pixiviz.darkEnabled && !window.pixiviz.darkPersist) {
      const hour = new Date().getHours();
      if (hour < 6 || hour >= 18) {
        document.documentElement.setAttribute('class', 'dark');
      }
    }
  }
});

export default router;
