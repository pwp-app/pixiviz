<template>
  <div :class="['lightbox', { 'lightbox--anim': anim }]" @click="handleClick">
    <img
      :class="[
        'lightbox-content',
        isLanding ? 'lightbox-content-landing' : null,
        isOverHeight ? 'lightbox-content-overheight' : null,
        isMobileOverHeight ? 'lightbox-content-mobileoverheight' : null,
      ]"
      :src="src"
      @load="handleOnLoad"
    />
  </div>
</template>

<script>
export default {
  name: 'Pic.LightBox',
  props: ['src', 'isLanding', 'isOverHeight', 'isMobileOverHeight'],
  watch: {
    src: {
      immediate: true,
      handler() {
        this.loaded = false;
      },
    },
  },
  data() {
    return {
      loaded: false,
      anim: false,
    };
  },
  mounted() {
    setImmediate(() => {
      this.anim = true;
    });
  },
  methods: {
    handleClick() {
      this.anim = false;
      setTimeout(() => {
        this.$emit('close');
      }, 100);
    },
    handleOnLoad() {
      this.loaded = true;
      this.$emit('loaded');
    },
  },
};
</script>
