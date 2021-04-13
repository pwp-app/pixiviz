<template>
  <div class="download-list-item">
    <div class="download-list-item-head">
      <div class="download-list-item-head__name">
        <span>{{ item.name }}</span>
      </div>
      <div class="download-list-item-head__progress">
        <span>{{ item.progress }}%</span>
      </div>
    </div>
    <div class="download-list-item-bar" :style="barStyle"></div>
  </div>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => ({
        name: '',
        progress: 0,
      }),
    },
  },
  computed: {
    barStyle() {
      const { progress } = this.item;
      if (this.$store.state.darkMode.enabled) {
        return `background-image: linear-gradient(to right, #d7707c 0%, #d7707c ${progress}%, #424242 ${progress}%, #424242 100%) !important;`;
      } else {
        return `background-image: linear-gradient(to right, #da7a85 0%, #da7a85 ${progress}%, #eaeaea ${progress}%, #eaeaea 100%) !important;`;
      }
    },
  },
};
</script>
