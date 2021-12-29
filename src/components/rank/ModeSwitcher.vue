<template>
  <div class="rank-mode-switcher">
    <div class="rank-mode-switcher-body">
      <div class="rank-mode-item-row">
        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'day' }"
          @click="handleClick('day')"
        >
          <span>日排行榜</span>
        </div>

        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'week' }"
          @click="handleClick('week')"
        >
          <span>周排行榜</span>
        </div>
        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'month' }"
          @click="handleClick('month')"
        >
          <span>月排行榜</span>
        </div>
        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'day_male' }"
          @click="handleClick('day_male')"
        >
          <span>男性热榜</span>
        </div>
        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'day_female' }"
          @click="handleClick('day_female')"
        >
          <span>女性热榜</span>
        </div>
        <div
          :class="{ 'rank-mode-item': true, 'rank-mode-item-picked': mode === 'week_rookie' }"
          @click="handleClick('week_rookie')"
        >
          <span>新秀周榜</span>
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
    },
  },
};
</script>
