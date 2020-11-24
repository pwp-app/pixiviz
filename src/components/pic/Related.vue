<template>
  <div class="pic-related">
    <div class="pic-related-title">
      <span>相关作品</span>
      <div class="pic-related-paginator" v-if="orientation !== 0 && oimages.length >= 6">
        <div class="pic-related-paginator-item pic-related-paginator__left" v-if="hasPrev" @click="handleGo(-1)">
          <i class="el-icon-arrow-left"></i>
        </div>
        <div class="pic-related-paginator-item pic-related-paginator__right" @click="handleGo(1)">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </div>
    <div class="pic-related-content">
      <div class="waterfall-wrapper">
        <Waterfall ref="waterfall"
          :images="images"
          @card-clicked="handleCardClicked"
          :cardWidth="cardWidth"
          imageType="square_medium"
          :squaredImage="true"
          />
      </div>
    </div>
    <div class="pic-related-content-completed" v-if="completed && images.length < 1">
      <span>没有相关图片...</span>
    </div>
    <infinite-loading
      v-if="orientation === 0 && images.length > 0"
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
    Waterfall
  },
  data() {
    return {
      screenWidth: window.innerWidth,
      // Waterfall
      waterfallIdentifier: Math.round(Math.random() * 100)
    }
  },
  computed: {
    hasPrev() {
      return this.page > 1;
    },
    cardWidth() {
      if (this.screenWidth > 1366) {
        this.$emit('change-page-size', 6);
        return 204;
      } else if (this.screenWidth > 1024 && this.screenWidth <= 1366) {
        if (this.orientation === 0) {
          this.$emit('change-page-size', 20);
          return Math.floor((this.screenWidth - 32) / 4) - 16;
        } else {
          this.$emit('change-page-size', 6);
          return 181;
        }
      } else if (this.screenWidth > 768 && this.screenWidth <= 1024) {
        this.$emit('change-page-size', 30);
        return Math.floor((this.screenWidth - 32) / 4) - 16;
      } else if (this.screenWidth > 567 && this.screenWidth <= 768) {
        this.$emit('change-page-size', 30);
        return Math.floor((this.screenWidth - 32) / 3) - 16;
      } else if (this.screenWidth <= 567) {
        this.$emit('change-page-size', 30);
        return Math.floor((this.screenWidth - 32) / 2) - 16;
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener("resize", this.windowResized, false);
    });
  },
  watch: {
    screenWidth(width) {
      this.screenWidth = width;
    }
  },
  destroyed(){
    window.removeEventListener("resize", this.windowResized, false);
  },
  methods: {
    reset() {
      // avoid error when waterfall ref is undefined
      if (!this.$refs.waterfall)  {
        return;
      }
      this.$refs.waterfall.$el.innerHTML = '';
    },
    // Window & Screen
    windowResized() {
      this.screenWidth = window.innerWidth;
    },
    // Event
    handleCardClicked(imageId) {
      // 设置缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      this.$router.push('/pic/'+imageId);
    },
    handleGo(toward) {
      this.$emit('go', toward);
    },
    infiniteHandler($state) {
      this.$emit('infite-load', $state);
    }
  }
}
</script>
