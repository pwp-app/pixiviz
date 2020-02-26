<template>
    <div class="rank-wrapper" v-lazy:background-image="rankBG">
        <div class="rank">
            <div class="rank-title">
                <span>排行榜</span>
            </div>
            <div class="rank-options">
                <div class="rank-options-text">
                    <span>日</span>
                </div>
                <span class="rank-options-split">/</span>
                <div class="rank-options-text">
                    <span>周</span>
                </div>
                <span class="rank-options-split">/</span>
                <div class="rank-options-text">
                    <span>月</span>
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
            rankBG: require('@/assets/images/rank.jpg')
        }
    }
}
</script>