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

export default {
    name: "app",
    beforeCreate() {
        // 全局构建
        if (!window.pixiviz) {
            window.pixiviz = {};
        }
        // 设置一个全局map
        if (!window.pixiviz.infoMap) {
            window.pixiviz.infoMap = {};
        }
    },
    created() {
        // 检测Safari
        window.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
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
