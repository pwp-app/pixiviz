<template>
  <div :class="['rankbox-wrapper', bannerExpanded ? 'rankbox-hide' : '']" v-show="show"></div>
</template>

<script>
export default {
  name: 'Landing.RankBoxPlaceholder',
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
};
</script>
