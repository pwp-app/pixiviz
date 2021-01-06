<template>
  <div class="lightbox" @click="handleClick">
    <img
      :class="[
        'lightbox-content',
        isLanding ? 'lightbox-content-landing' : null,
        isOverHeight ? 'lightbox-content-overheight' : null,
      ]"
      :src="src"
      v-context="'context'"
      @load="handleOnLoad"
    />
    <ContextMenu
      ref="context"
      :width="142"
      @item-clicked="handleContextClicked"
      >
      <ContextMenuItem name="down">下载</ContextMenuItem>
      <ContextMenuItem name="copy-link">复制图片链接</ContextMenuItem>
    </ContextMenu>
  </div>
</template>

<script>
export default {
  name: "Pic.LightBox",
  props: ["src", "isLanding", "isOverHeight"],
  methods: {
    handleClick() {
      this.$emit("close");
    },
    handleContextClicked(name) {
      if (name === 'down') {
        this.$emit('download');
      } else if (name === 'copy-link') {
        this.$emit('copy');
      }
    },
    handleOnLoad() {
      this.$emit('loaded');
    },
  },
};
</script>
