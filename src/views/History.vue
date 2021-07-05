<template>
  <div class="history">
    <div class="history-header">
      <div class="history-header-title">
        <span>历史记录</span>
        <span class="history-header-title--small">（您最近浏览的 100 个作品）</span>
        <div class="history-header-close">
          <i class="el-icon-close" @click="handleBack"></i>
        </div>
      </div>
    </div>
    <div class="history-body">
      <div class="history-body-empty">
        <span>这里还没有历史记录，快去浏览你喜欢的作品吧~</span>
      </div>
      <div class="waterfall-wrapper">
        <Waterfall
          :class="{
            'waterfall-responsive': waterfallResponsive,
          }"
          :key="waterfallResponsive"
          ref="waterfall"
          :images="images"
          @card-clicked="handleCardClicked"
          :cardWidth="cardWidth"
          imageType="medium"
          :style="waterfallResponsive ? null : { width: `${mobileWaterfallWidth}px` }"
        />
      </div>
    </div>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
import Waterfall from '../components/common/Waterfall';
import BackToTop from '../components/common/BackToTop';
import MobileResponsive from '../util/MobileResponsive';
import { getUserHistory } from '../util/history';

export default {
  components: {
    Waterfall,
    BackToTop,
  },
  data() {
    return {
      screenWidth: document.documentElement.screenWidth,
      cardWidth: MobileResponsive.getCardWidth(document.documentElement.clientWidth),
      waterfallResponsive: document.documentElement.clientWidth > 767,
      scrollTop: 0,
      images: [],
    };
  },
  watch: {
    screenWidth(width) {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        this.screenWidth = width;
        // After waterfall rerendered, keep the scroll state
        this.scrollTop = document.documentElement.scrollTop;
        if (this.screenWidth <= 767) {
          this.waterfallResponsive = false;
        } else {
          this.waterfallResponsive = true;
        }
        this.$nextTick(() => {
          this.cardWidth = this.getCardWidth(this.screenWidth);
          document.documentElement.scrollTop = this.scrollTop;
        });
      }, 300);
    },
  },
  computed: {
    showEmpty() {
      if (!this.images || !this.images.length) {
        return true;
      }
      return false;
    },
    mobileWaterfallWidth() {
      return this.cardWidth * 2 + 32;
    },
  },
  async created() {
    await this.getImages();
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    // modify title
    document.title = '历史记录 - Pixiviz';
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('resize', this.windowResized, false);
  },
  methods: {
    async getImages() {
      this.images = (await getUserHistory()) || [];
    },
    handleCardClicked(imageId) {
      this.$cookies.set('pic-from', 'user-history', '1h');
      // set image cache
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      this.$router.push(`/pic/${imageId}`);
    },
    handleBack() {
      this.$router.push('/');
    },
    handleScroll() {
      this.$cookies.set('user-history-scroll', document.documentElement.scrollTop, '1h');
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
  },
};
</script>
