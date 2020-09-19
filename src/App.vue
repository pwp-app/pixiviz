<template>
    <div id="app">
        <transition mode="out-in">
            <keep-alive v-if="$route.meta.keepAlive">
                <router-view></router-view>
            </keep-alive>
            <router-view v-else></router-view>
        </transition>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import CONFIG from './config.json';

export default {
    name: "app",
    beforeCreate() {
        // 全局构建
        if (!window.pixiviz) {
            window.pixiviz = {};
        }
        // 设置全局map
        if (!window.pixiviz.infoMap) {
            window.pixiviz.infoMap = {};
        }
        if (!window.pixiviz.artistMap) {
            window.pixiviz.artistMap = {};
        }
        // 初始化图片负载表
        if (!window.pixiviz.loadMap) {
            const loadMap = JSON.parse(window.localStorage.getItem('loadmap'));
            const loadMapTime = window.localStorage.getItem('loadmap-save-time');
            if (!loadMap || !loadMapTime) {
                window.pixiviz.loadMap = {};
            } else if (loadMapTime && new Date().valueOf() / 1000 - loadMapTime > 10800) {
                window.pixiviz.loadMap = {};
            } else if (loadMap) {
                window.pixiviz.loadMap = loadMap;
            }
        }
        // 异步获取分流配置
        this.axios.get('https://config.backrunner.top/pixiviz/proxy-config.json', {
            withCredentials: false,
        }).then((res) => {
            if (res.data) {
                let index = 0;
                window.pixiviz.hostMap = {};
                Object.keys(res.data).forEach((key) => {
                    window.pixiviz.hostMap[index] = key;
                    window.pixiviz.hostMap[key] = index;
                    index++;
                });
                window.pixiviz.proxyMap = res.data;
            }
        }, () => {
            console.log('Cannot fetch proxy config.');
        });
    },
    created() {
        // 检测Safari
        window.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    },
    mounted() {
        // add save loadmap listener
        window.addEventListener('beforeunload', this.saveLoadMap);
    },
    destroyed() {
        window.removeEventListener('beforeunload', this.saveLoadMap);
    },
    methods: {
        saveLoadMap() {
            if (window.pixiviz.loadMap && Object.keys(window.pixiviz.loadMap).length > 0) {
                window.localStorage.setItem('loadmap', JSON.stringify(window.pixiviz.loadMap));
                window.localStorage.setItem('loadmap-save-time', new Date().valueOf());
            }
        }
    }
}
</script>

<style>
.v-enter {
    opacity: 0;
}
.v-enter-active {
    transition: 200ms;
}
.v-enter-to {
    opacity: 1;
}
.v-leave {
    opacity: 1;
}
.v-leave-to {
    opacity: 0;
}
.v-leave-active {
    transition: 200ms;
}
</style>
