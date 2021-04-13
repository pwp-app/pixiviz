<template>
  <div class="container-notfound">
    <div class="notfound-wrapper">
      <div class="notfound-title">
        <span>啊，这里没有东西...</span>
      </div>
      <div class="notfound-button">
        <el-button type="primary" round @click="goBack">返回之前的页面</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  methods: {
    goBack() {
      window.history.go(-1);
    },
  },
  mounted() {
    document.title = '404 - Pixiviz';
  },
};
</script>
