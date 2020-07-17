import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        name: "Landing",
        component: () => import(/* webpackChunkName: "landing" */ "../views/Landing.vue"),
        meta: { keepAlive: false },
    },
    {
        path: "/rank",
        name: "Rank",
        component: () => import(/* webpackChunkName: "rank" */ "../views/Rank.vue"),
        meta: { keepAlive: true },
    },
    {
        path: "/pic/:id",
        name: "Pic",
        component: () => import(/* webpackChunkName: "pic" */ "../views/PicDetail.vue"),
        meta: { keepAlive: false },
    },
    {
        path: "/search/:keyword",
        name: "Search",
        component: () => import(/* webpackChunkName: "search" */ "../views/Search.vue"),
        meta: { keepAlive: true },
    },
    {
        path: "/404",
        name: "Page not found",
        component: () => import(/* webpackChunkName: "notfound" */ "../views/404.vue"),
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

export default router;
