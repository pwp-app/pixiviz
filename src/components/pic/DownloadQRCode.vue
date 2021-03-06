<template>
  <div class="downloadqr-wrapper" @click.self="handleWrapperClicked" :style="wrapperStyles">
    <div class="downloadqr">
      <div class="downloadqr-code" v-html="code"></div>
      <div class="downloadqr-tip">
        <span>请使用手机扫描二维码下载图片</span>
      </div>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode-svg';

export default {
  data() {
    return {
      show: false,
      url: 'https://pixiviz.pwp.app/',
    };
  },
  computed: {
    wrapperStyles() {
      return this.show ? "display: flex;" : "display: none;";
    },
    code() {
      return new QRCode(this.url).svg();
    },
  },
  methods: {
    open() {
      this.show = true;
      let url = window.location.href;
      if (window.location.href.includes('?')) {
        url += '&';
      } else {
        url += '?';
      }
      url += 'mobileDownload=true';
      this.url = url;
    },
    handleWrapperClicked() {
      this.show = false;
    },
  },
};
</script>