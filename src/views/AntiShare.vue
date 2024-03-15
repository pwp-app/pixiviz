<template>
  <div class="anti-share">
    <div class="anti-share-wrapper">
      <div class="anti-share-title">
        <p>我们拒绝营销号任何形式的宣传、分享、导流</p>
        <p>分享访问已全面屏蔽</p>
        <p>请自行寻找其他访问方式</p>
      </div>
      <div class="anti-share-footer">
        <p>Pixiviz - 2024</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AntiShare',
  mounted() {
    document.title = 'Anti Share - Pixiviz';
  },
};
</script>
