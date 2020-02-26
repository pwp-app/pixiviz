<template>
    <div class="banner-wrapper" v-lazy:background-image="bannerBG">
        <div class="banner">
            <div class="banner-title">
                <span>Pixiv C</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "Landing.Banner",
    data() {
        return {
            bannerBG: require('@/assets/images/banner.jpg')
        }
    }
}
</script>