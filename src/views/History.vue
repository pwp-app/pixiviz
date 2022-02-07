<template>
  <div class="history">
    <div class="history-header">
      <div class="history-header-title">
        <span>历史记录</span>
        <span class="history-header-title--small">（您最近浏览的 100 个作品）</span>
        <div class="history-header-close">
          <i class="el-icon-delete" @click="clearHistory" v-if="!showEmpty"></i>
          <i class="el-icon-close" @click="handleBack"></i>
        </div>
      </div>
    </div>
    <div class="history-body">
      <div class="history-body-empty" v-if="showEmpty">
        <span>
          <span>这里还没有历史记录</span>
          <span class="mobile-hide">，</span>
          <span>快去浏览你喜欢的作品吧~</span>
        </span>
      </div>
      <div class="waterfall-wrapper" v-else>
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
import { clearHistory, getUserHistory } from '../util/history';
import { clearRemoteHistory } from '@/util/pixland';

let broadCastChannel;

function updateMessageHandler(e) {
  // eslint-disable-next-line no-console
  console.debug('[History] Cross window broad message', e);
  if (!e.isTrusted) {
    return;
  }
  setTimeout(() => {
    this.getImages({ bypass: true });
  });
}

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
    this.$bus.$on('history-updated', this.getImages);
    if (window.BroadcastChannel) {
      broadCastChannel = new BroadcastChannel('pixiviz-history');
      broadCastChannel.onmessage = updateMessageHandler.bind(this);
    }
    await this.getImages();
  },
  mounted() {
    // do scroll
    const scrollTop = parseInt(this.$cookies.get('user-history-scroll'), 10);
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
      this.$cookies.set('user-history-scroll', 0, '1h');
    }
    // set event listeners
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    // modify title
    document.title = '历史记录 - Pixiviz';
  },
  beforeDestroy() {
    this.$bus.$off('history-updated', this.getImages);
    if (broadCastChannel) {
      broadCastChannel.close();
    }
    window.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('resize', this.windowResized, false);
  },
  methods: {
    async getImages({ bypass = false } = {}) {
      if (this.images.length) {
        this.images = [];
        this.$forceUpdate();
        this.$nextTick(() => {
          // refresh in next tick
          this.getImages({ bypass });
        });
        return;
      }
      const history = await getUserHistory({ bypass });
      // eslint-disable-next-line no-console
      console.debug('[History] History storage gotten', history);
      this.images = history || [];
      this.$forceUpdate();
    },
    handleCardClicked(imageId) {
      this.$cookies.set('pic-from', 'history', '1h');
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
    async clearHistory() {
      const isLogin = this.pixland?.isLogin();
      try {
        await this.$confirm(`您确定要清空历史记录吗？被清空的记录将无法恢复${ isLogin ? '（已经同步到云端的记录将被一并清空）' : ''}`, '确认');
      } catch {
        return;
      }
      clearHistory();
      if (isLogin) {
        clearRemoteHistory();
      }
      this.images = [];
      this.$forceUpdate();
    },
  },
};
</script>
