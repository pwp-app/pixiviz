<template>
  <div class="anti-share">
    <div class="anti-share-wrapper">
      <div class="anti-share-title">
        <p>我们拒绝营销号以营利为目的</p>
        <p style="margin-bottom: 3rem">对我们进行宣传、导流</p>
        <p>微信直链访问已全面屏蔽</p>
        <p>请自行寻找其他访问方式</p>
      </div>
      <div class="anti-share-footer">
        <p>Pixiviz 站务 - 2022.4</p>
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
