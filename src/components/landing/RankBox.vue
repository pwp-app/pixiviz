<template>
    <div :class="['rankbox-wrapper', bannerExpanded ? 'rankbox-hide' : '']" v-show="show" v-lazy:background-image="rankboxBG">
        <div class="rankbox">
            <div class="rankbox-title">
                <span>排行榜</span>
            </div>
            <div class="rankbox-options">
                <div class="rankbox-options-text" @click="torankbox('month')">
                    <span>月</span>
                </div>
                <span class="rankbox-options-split">/</span>
                <div class="rankbox-options-text" @click="torankbox('week')">
                    <span>周</span>
                </div>
                <span class="rankbox-options-split">/</span>
                <div class="rankbox-options-text" @click="torankbox('day')">
                    <span>日</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Landing.RankBox',
    data() {
        return {
            show: true,
            rankboxBG: require('@/assets/images/rank.jpg'),
            bannerExpanded: false
        }
    },
    watch: {
        "$store.state.landingBanner.expanded": function(expanded) {
            if (expanded) {
                this.bannerExpanded = expanded;
                setTimeout(() => {
                    this.show = false;
                }, 500);
            } else {
                this.show = true;
                setTimeout(() => {
                    this.bannerExpanded = expanded;
                }, 150);
            }
        }
    },
    methods: {
        torankbox(mode) {
            this.$cookies.set('rankbox-mode', mode, '1h');
            this.$router.push({
                name: 'Rank'
            });
        }
    }
}
</script>