<template>
  <div class="pic-related">
    <div class="pic-related-title">
      <span>相关作品</span>
      <div
        class="pic-related-paginator"
        v-if="orientation.includes('landscape') && oimages.length >= 6"
      >
        <div
          class="pic-related-paginator-item pic-related-paginator__left"
          v-if="hasPrev"
          @click="handleGo(-1)"
        >
          <i class="el-icon-arrow-left"></i>
        </div>
        <div class="pic-related-paginator-item pic-related-paginator__right" @click="handleGo(1)">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </div>
    <div class="pic-related-content">
      <div class="waterfall-wrapper">
        <Waterfall
          ref="waterfall"
          :images="images"
          @card-clicked="handleCardClicked"
          :cardWidth="cardWidth"
          :squaredImage="true"
          imageType="square_medium"
        />
      </div>
    </div>
    <div class="pic-related-content-completed" v-if="completed && images.length < 1">
      <span>没有相关图片...</span>
    </div>
    <infinite-loading
      v-if="orientation.includes('portrait') && images.length > 0"
      :identifier="waterfallIdentifier"
      @infinite="infiniteHandler"
      spinner="spiral"
    ></infinite-loading>
  </div>
</template>

<script>
import Waterfall from '../../components/common/Waterfall';

export default {
  name: 'Pic.Related',
  props: ['images', 'oimages', 'page', 'orientation', 'completed'],
  components: {
    Waterfall,
  },
  data() {
    return {
      screenWidth: document.documentElement.clientWidth,
      screenHeight: document.documentElement.clientHeight,
      // Waterfall
      waterfallIdentifier: Math.round(Math.random() * 100),
    };
  },
  computed: {
    hasPrev() {
      return this.page > 1;
    },
    cardWidth() {
      if (this.screenWidth >= 1360) {
        this.$emit('change-page-size', 6);
        return 208;
      } else if (this.screenWidth > 1024 && this.screenWidth < 1360) {
        if (this.orientation.includes('portrait')) {
          this.$emit('change-page-size', 20);
          return Math.floor((this.screenWidth - 32) / 4) - 16;
        } else {
          this.$emit('change-page-size', 6);
          return 172;
        }
      } else if (this.screenWidth > 768 && this.screenWidth <= 1024) {
        if (this.orientation.includes('portrait') || this.screenWidth < this.screenHeight) {
          this.$emit('change-page-size', 20);
          return Math.floor((this.screenWidth - 32) / 4) - 16;
        } else {
          this.$emit('change-page-size', 6);
          return 151;
        }
      } else if (this.screenWidth > 567 && this.screenWidth <= 768) {
        this.$emit('change-page-size', 30);
        return Math.floor((this.screenWidth - 32) / 3) - 16;
      } else if (this.screenWidth <= 567) {
        this.$emit('change-page-size', 30);
        return Math.floor((this.screenWidth - 32) / 2) - 16;
      }
      this.$emit('change-page-size', 30);
      return Math.floor((this.screenWidth - 32) / 2) - 16;
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
    });
  },
  watch: {
    images() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    oimages() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    screenWidth(width) {
      this.screenWidth = width;
    },
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.windowResized, false);
  },
  methods: {
    // Window & Screen
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
      this.screenHeight = document.documentElement.clientHeight;
    },
    // Event
    handleCardClicked(imageId) {
      // 设置缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      const targetPath = `/pic/${imageId}`;
      if (this.$route.path !== targetPath) {
        this.$router.push(targetPath);
      }
    },
    handleGo(toward) {
      this.$emit('go', toward);
    },
    infiniteHandler($state) {
      this.$emit('infite-load', $state);
    },
  },
};
</script>
