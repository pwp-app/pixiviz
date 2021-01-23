<template>
  <div class="wxdonate">
    <div
      class="wxdonate-code"
      id="wxdonate"
      data-type="qrcode"
      v-if="!donateLoadError"
      v-loading="donateLoading"
      v-lazy:background-image="donateCode"
    ></div>
    <div class="wxdonate-code-error" v-else>
      <span>加载失败</span>
    </div>
    <span class="wxdonate-tip" v-if="!donateLoadError">使用微信扫码</span>
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
    console.log(0);
  },
  beforeDestroy() {
    this.$bus.$off('qrcode-wxdonate-loaded', this.donateCodeLoaded);
    this.$bus.$off('qrcode-wxdonate-error', this.donateCodeLoadError);
  },
  methods: {
    // donate
    donateCodeLoaded() {
      console.log(2);
      this.donateLoading = false;
    },
    donateCodeLoadError() {
      this.donateLoading = false;
      this.donateLoadError = true;
    },
  },
};
</script>