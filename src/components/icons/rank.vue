<template>
  <i class="icon icon-rank" @click="handleClick"></i>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('action', 'rank');
    },
  },
};
</script>

<style lang="less" scoped>
.icon-rank {
  background-image: url('~@/assets/icons/rank.svg');
}
</style>
