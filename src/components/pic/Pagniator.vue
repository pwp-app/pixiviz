<template>
  <div class="pic-presentation-page" v-if="pageCount > 1">
    <div class="pic-presentation-page-back" @click="handleGo(-1)">
      <template v-if="page > 1">
        <i class="el-icon-arrow-left"></i>
        <span>前一页</span>
      </template>
    </div>
    <div class="pic-presentation-page-back" v-if="pageCount <= 1"></div>
    <div class="pic-presentation-page-number">
      <span>{{ page }} / {{ pageCount }}</span>
    </div>
    <div class="pic-presentation-page-next" v-if="page < pageCount" @click="handleGo(1)">
      <span>下一页</span>
      <i class="el-icon-arrow-right"></i>
    </div>
    <div class="pic-presentation-page-next" v-if="page >= pageCount"></div>
  </div>
</template>

<script>
export default {
  name: 'Pic.Pagniator',
  props: ['page', 'pageCount'],
  methods: {
    handleGo(toward) {
      this.$emit('page-turn', toward);
    },
  },
};
</script>
