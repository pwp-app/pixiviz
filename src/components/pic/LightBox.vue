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
      v-context="'context'"
      @load="handleOnLoad"
    />
    <ContextMenu ref="context" :width="128" @item-clicked="handleContextClicked">
      <ContextMenuItem name="down">下载</ContextMenuItem>
      <ContextMenuItem name="copy-image" v-if="showCopyImage">复制图片</ContextMenuItem>
    </ContextMenu>
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
      supportCopyImage: !!window.ClipboardItem,
      anim: false,
    };
  },
  computed: {
    showCopyImage() {
      return this.supportCopyImage && this.loaded;
    },
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
    handleContextClicked(name) {
      if (name === 'down') {
        this.$emit('download');
      } else if (name === 'copy-image') {
        this.$emit('copy');
      }
    },
    handleOnLoad() {
      this.loaded = true;
      this.$emit('loaded');
    },
  },
};
</script>
