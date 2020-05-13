<template>
    <div class="rank-mode-switcher">
        <div class="rank-mode-switcher-body">
            <div class="rank-mode-item-row">
                <div class="rank-mode-item-tag">
                    <span>综合</span>
                </div>
                <div :class="['rank-mode-item', mode === 'month' ? 'rank-mode-item-picked' : null]" @click="handleClick('month')">
                    <span>月排行榜</span>
                </div>
                <div :class="['rank-mode-item', mode === 'week' ? 'rank-mode-item-picked' : null]" @click="handleClick('week')">
                    <span>周排行榜</span>
                </div>
                <div :class="['rank-mode-item', mode === 'day' ? 'rank-mode-item-picked' : null]" @click="handleClick('day')">
                    <span>日排行榜</span>
                </div>
            </div>
            <div class="rank-mode-item-row">
                <div class="rank-mode-item-tag">
                    <span>漫画</span>
                </div>
                <div :class="['rank-mode-item', mode === 'month_manga' ? 'rank-mode-item-picked' : null]" @click="handleClick('month_manga')">
                    <span>月排行榜</span>
                </div>
                <div :class="['rank-mode-item', mode === 'week_manga' ? 'rank-mode-item-picked' : null]" @click="handleClick('week_manga')">
                    <span>周排行榜</span>
                </div>
                <div :class="['rank-mode-item', mode === 'day_manga' ? 'rank-mode-item-picked' : null]" @click="handleClick('day_manga')">
                    <span>日排行榜</span>
                </div>
                <div :class="['rank-mode-item', mode === 'week_rookie_manga' ? 'rank-mode-item-picked' : null]" @click="handleClick('week_rookie_manga')">
                    <span>新秀周排行榜</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Rank.ModeSwitcher',
    props: ['mode'],
    methods: {
        handleClick(mode) {
            this.$emit('mode-changed', mode);
        }
    }
}
</script>