<template>
    <div id="app">
        <transition mode="out-in">
            <router-view></router-view>
        </transition>
    </div>
</template>

<script>

export default {
    name: "app",
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
