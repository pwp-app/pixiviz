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
            this.$cookies.set('rank-mode', mode, '30min');
            this.$cookies.set('rank-from', 'Landing', '30min');
            // 如果是返回到主界面再重新打开排行榜，且与缓存非同一排行榜，则重置相关缓存
            if (this.$store.state.rank.mode && this.$store.state.rank.mode != mode) {
                this.$store.commit('rank/setReset', true);
            }
            this.$router.push({
                name: 'Rank'
            });
        }
    }
}
</script>