<template>
  <div :class="['rankbox-wrapper', bannerExpanded ? 'rankbox-hide' : '']" v-show="show">
    <div class="rankbox">
      <div class="rankbox-title">
        <span>排行榜</span>
      </div>
      <div class="rankbox-options">
        <div class="rankbox-options-text" data-mode="month" @click.prevent="toRank('month')">
          <a href="/rank?mode=month">月</a>
        </div>
        <span class="rankbox-options-split">/</span>
        <div class="rankbox-options-text" @click.prevent="toRank('week')" data-mode="week">
          <a href="/rank?mode=week">周</a>
        </div>
        <span class="rankbox-options-split">/</span>
        <div class="rankbox-options-text" @click.prevent="toRank('day')" data-mode="day">
          <a href="/rank?mode=day">日</a>
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
      bannerExpanded: false,
    };
  },
  watch: {
    '$store.state.landingBanner.expanded': function (expanded) {
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
    },
  },
  methods: {
    toRank(mode) {
      this.$cookies.set('rank-from', '', '1h');
      this.$cookies.set('rank-mode', mode, '1h');
      this.$cookies.set('rank-scroll', 0, '1h');
      this.$cookies.set('rank-reset', 'true', '1h');
      this.$router.push('/rank');
    },
  },
};
</script>
