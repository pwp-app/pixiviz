<template>
  <i class="icon icon-link" @click="handleClick"></i>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('action', 'copy-image');
    },
  },
};
</script>

<style lang="less" scoped>
.icon-link {
  background-image: url('~@/assets/icons/link.svg');
}
</style>
