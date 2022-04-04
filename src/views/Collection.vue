<template>
  <div class="collection">
    <div class="collection-header">
      <div class="collection-header-title">
        <div class="collection-header-title__left">
          <span>收藏夹</span>
          <span class="count-limit">已用栏位 {{ existedCount }}/{{ COLLECTION_SIZE_LIMIT }}</span>
        </div>

        <div class="collection-header-close">
          <i class="el-icon-close" @click="handleBack"></i>
        </div>
      </div>
    </div>
    <div class="collection-body">
      <div class="collection-body-empty" v-if="showEmpty">
        <span>
          <span>您尚未收藏任何作品</span>
          <span class="mobile-hide">，</span>
          <span>快去浏览你喜欢的作品吧~</span>
        </span>
      </div>
      <div class="waterfall-wrapper" v-else>
        <Waterfall
          :class="{
            'waterfall-responsive': waterfallResponsive,
          }"
          :key="`${waterfallResponsive}_${waterfallKey}`"
          ref="waterfall"
          :images="images"
          @card-clicked="handleCardClicked"
          :cardWidth="cardWidth"
          imageType="medium"
          :style="waterfallResponsive ? null : { width: `${mobileWaterfallWidth}px` }"
        />
        <p class="waterfall-end">没有更多记录了</p>
      </div>
    </div>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
import Waterfall from '../components/common/Waterfall';
import BackToTop from '../components/common/BackToTop';
import MobileResponsive from '../util/MobileResponsive';
import { getUserCollection, COLLECTION_SIZE_LIMIT } from '../util/collection';

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
      waterfallKey: 0,
      scrollTop: 0,
      images: [],
      existedCount: 0,
      COLLECTION_SIZE_LIMIT,
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
          this.cardWidth = MobileResponsive.getCardWidth(this.screenWidth);
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
    // do scroll
    const scrollTop = parseInt(this.$cookies.get('user-collection-scroll'), 10);
    if (this.images.length > 0) {
      if (scrollTop) {
        this.$nextTick(() => {
          window.scrollTo(0, scrollTop);
          if (scrollTop > 300) {
            this.$refs.backToTop && this.$refs.backToTop.display();
          }
        });
      }
    } else {
      this.$cookies.set('user-collection-scroll', 0, '1h');
    }
    // set event listeners
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    // modify title
    document.title = '收藏夹 - Pixiviz';
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('resize', this.windowResized, false);
  },
  methods: {
    async getImages({ bypass = false } = {}) {
      if (this.images.length) {
        this.images = [];
        this.waterfallKey += 1;
        this.$forceUpdate();
        this.$nextTick(() => {
          // refresh in next tick
          this.getImages({ bypass });
        });
        return;
      }
      const collection = (await getUserCollection({ bypass })) || {};
      this.existedCount =
        Object.keys(collection).reduce((res, curr) => {
          if (!Array.isArray(collection[curr])) {
            return res;
          }
          return res + collection[curr].length;
        }, 0) || 0;
      this.images = collection.default || [];
      this.$forceUpdate();
    },
    handleCardClicked(imageId) {
      this.$cookies.set('pic-from', 'collection', '1h');
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
      this.$cookies.set('user-collection-scroll', document.documentElement.scrollTop, '1h');
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
  },
};
</script>
