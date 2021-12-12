<template>
  <i class="icon icon-home" @click="handleClick"></i>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('action', 'home');
    },
  },
};
</script>

<style lang="less" scoped>
.icon-home {
  background-image: url('~@/assets/icons/home.svg');
}
</style>
