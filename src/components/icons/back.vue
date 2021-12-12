<template>
  <i class="icon icon-back" @click="handleClick"> </i>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('action', 'back');
    },
  },
};
</script>

<style lang="less" scoped>
.icon-back {
  background-image: url('~@/assets/icons/back.svg');
}
</style>
