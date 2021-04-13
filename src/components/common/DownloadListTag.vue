<template>
  <div class="right-tag right-tag-clickable tag-download" @click="handleClick">
    <span>图片下载中 ({{ donwloadCount }})</span>
  </div>
</template>

<script>
export default {
  computed: {
    donwloadCount() {
      return this.$store.state.download.list.length;
    },
  },
  methods: {
    handleClick() {
      this.$bus.$emit('openDownloadList');
    },
  },
};
</script>
