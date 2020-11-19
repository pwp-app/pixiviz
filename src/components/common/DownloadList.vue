<template>
  <div class="right-tag tag-download">
    <span>图片下载中 ({{donwloadCount}})</span>
  </div>
</template>

<script>
export default {
  computed: {
    donwloadCount() {
      return this.$store.state.download.list.length;
    }
  },
}
</script>
