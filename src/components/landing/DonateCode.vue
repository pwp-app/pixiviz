<template>
  <div class="qrpopup">
    <div
      class="qrpopup-code"
      id="wxdonate"
      data-type="qrcode"
      v-if="!donateLoadError"
      v-loading="donateLoading"
      v-lazy:background-image="donateCode"
    ></div>
    <div class="qrpopup-code-error" v-else>
      <span>加载失败</span>
    </div>
    <span class="qrpopup-tip" v-if="!donateLoadError">使用微信扫码</span>
  </div>
</template>

<script>
import donateCodeJpeg from '../../assets/images/donateCode.jpg';
import donateCodeWebp from '../../assets/images/donateCode.webp';

export default {
  data() {
    return {
      donateCode: window.isSafari ? donateCodeJpeg : donateCodeWebp,
      donateLoading: true,
      donateLoadError: false,
    };
  },
  created() {
    this.$bus.$on('qrcode-wxdonate-loaded', this.donateCodeLoaded);
    this.$bus.$on('qrcode-wxdonate-error', this.donateCodeLoadError);
  },
  beforeDestroy() {
    this.$bus.$off('qrcode-wxdonate-loaded', this.donateCodeLoaded);
    this.$bus.$off('qrcode-wxdonate-error', this.donateCodeLoadError);
  },
  methods: {
    // donate
    donateCodeLoaded() {
      this.donateLoading = false;
    },
    donateCodeLoadError() {
      this.donateLoading = false;
      this.donateLoadError = true;
    },
  },
};
</script>