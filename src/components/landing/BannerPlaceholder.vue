<template>
  <div
    :class="[
      'banner-wrapper',
      expanded ? 'banner-expanded' : '',
      clearMarginBottom ? 'clear-margin-bottom' : '',
    ]"
  ></div>
</template>

<script>
export default {
  name: 'Landing.BannerPlaceholder',
  data() {
    return {
      expanded: false,
      expandLock: false,
      titleUp: false,
      aboutShow: false,
      clearMarginBottom: false,
    };
  },
  methods: {
    expandedChanged(expanded) {
      if (expanded) {
        this.expanded = true;
        // Hide scrollbar
        const classes = document.body.getAttribute('class');
        if (!(classes && classes.includes('no-scrollbar'))) {
          document.body.setAttribute('class', `${classes} no-scrollbar`);
        }
        setTimeout(() => {
          this.clearMarginBottom = true;
        }, 200);
        setTimeout(() => {
          this.titleUp = true;
          setTimeout(() => {
            this.aboutShow = true;
            setTimeout(() => {
              this.expandLock = false;
            }, 500);
          }, 350);
        }, 350);
      } else {
        this.aboutShow = false;
        this.clearMarginBottom = false;
        // Hide scrollbar
        const classes = document.body.getAttribute('class');
        if (!(classes && classes.includes('no-scrollbar'))) {
          document.body.setAttribute('class', `${classes} no-scrollbar`);
        }
        setTimeout(() => {
          this.titleUp = false;
          setTimeout(() => {
            this.expanded = false;
            setTimeout(() => {
              this.expandLock = false;
            }, 500);
          }, 350);
        }, 350);
      }
    },
  },
};
</script>
