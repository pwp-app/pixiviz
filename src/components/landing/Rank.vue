<template>
    <div :class="['rank-wrapper', bannerExpanded ? 'rank-hide' : '']" v-show="show" v-lazy:background-image="rankBG">
        <div class="rank">
            <div class="rank-title">
                <span>排行榜</span>
            </div>
            <div class="rank-options">
                <div class="rank-options-text">
                    <span>月</span>
                </div>
                <span class="rank-options-split">/</span>
                <div class="rank-options-text">
                    <span>周</span>
                </div>
                <span class="rank-options-split">/</span>
                <div class="rank-options-text">
                    <span>日</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Landing.Rank',
    data() {
        return {
            show: true,
            rankBG: require('@/assets/images/rank.jpg'),
            bannerExpanded: false
        }
    },
    mounted() {
        this.$bus.on('banner-changed', this.bannerChanged);
    },
    methods: {
        bannerChanged(status) {
            if (status) {
                this.bannerExpanded = status;
                setTimeout(() => {
                    this.show = false;
                }, 400);
            } else {
                this.show = true;
                setTimeout(() => {
                    this.bannerExpanded = status;
                }, 350);
            }
        }
    }
}
</script>