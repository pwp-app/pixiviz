<template>
  <div :class="['searchbox-wrapper', bannerExpanded ? 'searchbox-hide' : '']" v-show="show"></div>
</template>

<script>
export default {
  name: 'Landing.SearchBoxPlaceholder',
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
