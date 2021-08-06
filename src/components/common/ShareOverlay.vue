<template>
  <div class="share-overlay" @click.stop="handleOverlayClicked">
    <div class="share-overlay-control">
      <div class="share-overlay-control__icon">
        <i class="el-icon-top"></i>
      </div>
      <div class="share-overlay-control__text">
        <span>点击上方按钮进行分享</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    handleOverlayClicked() {
      this.$emit('close');
      document.body.classList.remove('no-scrollbar');
    },
  },
};
</script>
