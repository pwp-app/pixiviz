<template>
  <div class="collection">
    <div class="collection-header">
      <div class="collection-header-title">
        <div class="collection-header-title__left">
          <span>收藏夹</span>
          <span class="count-limit">已用栏位 {{ existedCount }}/{{ COLLECTION_SIZE_LIMIT }}</span>
          <SyncStatus v-if="syncStatus" :status="syncStatus" ref="syncStatus" @retry="retrySync" />
        </div>
        <div class="collection-header-close">
          <i class="el-icon-close" @click="handleBack"></i>
        </div>
      </div>
    </div>
    <div class="collection-body">
      <div class="collection-body-empty" v-if="showEmpty && !collectionLoading">
        <span>
          <span>您尚未收藏任何作品</span>
          <span class="mobile-hide">，</span>
          <span>快去浏览你喜欢的作品吧~</span>
        </span>
      </div>
      <div class="collection-body-empty collection-body-loading-wrapper" v-if="collectionLoading">
        <span>稍等一下喵，正在寻找收藏夹的数据~</span>
        <div class="collection-body-loading">
          <i class="loading-spiral" spinner="spiral"></i>
        </div>
      </div>
      <div class="waterfall-wrapper" v-if="!showEmpty && !collectionLoading">
        <Waterfall
          ref="waterfall"
          imageType="medium"
          :class="{
            'waterfall-responsive': waterfallResponsive,
          }"
          :key="`${waterfallResponsive}_${waterfallKey}`"
          :images="images"
          :cardWidth="cardWidth"
          :style="waterfallResponsive ? null : { width: `${mobileWaterfallWidth}px` }"
          :isCollection="true"
          @card-clicked="handleCardClicked"
          @card-removed="handleCardRemoved"
        />
        <p class="waterfall-end">
          <template v-if="existedCount < COLLECTION_SIZE_LIMIT"
            >没有更多收藏了，快去寻找一些你喜欢的画作吧~</template
          >
          <template v-else>收藏夹看起来装不下更多画作了，先整理一下吧~</template>
        </p>
      </div>
    </div>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
import cloneDeep from 'lodash-es/cloneDeep';
import Waterfall from '../components/common/Waterfall';
import BackToTop from '../components/common/BackToTop';
import SyncStatus from '../components/common/SyncStatus.vue';
import MobileResponsive from '../util/MobileResponsive';
import { getUserCollection, COLLECTION_SIZE_LIMIT, removeFromCollection } from '../util/collection';
import { syncData } from '../util/pixland';

export default {
  components: {
    Waterfall,
    BackToTop,
    SyncStatus,
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
      notFirstUse: window.localStorage.getItem('pixiviz-user-collect-first-entry') === 'true',
      currentCategory: 'default',
      collectionLoading: false,
      syncStatus: '',
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
    this.collectionLoading = true;
    try {
      await this.getImages();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      this.collectionLoading = false;
    }
    if (this.pixland?.isLogin) {
      this.syncRemoteData(true);
    }
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
    // first entry notification
    if (!this.notFirstUse) {
      this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 10000,
        message: `
          <div class="oneline-notice">
            <span data-name="notice-download">欢迎使用收藏夹，目前您可以在此收藏最多500个作品。收藏夹同步正在开发中，敬请期待~</span>
          </div>`,
      });
      window.localStorage.setItem('pixiviz-user-collect-first-entry', true);
    }
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
      this.images = collection[this.currentCategory] || [];
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
    handleCardRemoved(imageId) {
      // remove from local db
      removeFromCollection(this.currentCategory, imageId);
      // update component local images
      const localIdx = this.images.findIndex((item) => item.id === imageId);
      if (localIdx >= 0) {
        this.images.splice(localIdx, 1);
      }
      this.$message.success('已取消收藏该作品');
      this.waterfallKey += 1;
      this.$forceUpdate();
      // trigger sync
      if (this.pixland?.isLogin) {
        this.syncRemoteData();
      }
    },
    async retrySync() {
      await this.syncRemoteData(true);
    },
    async syncRemoteData(doRefresh = false) {
      try {
        this.syncStatus = 'syncing';
        await syncData({ immediate: true });
        this.syncStatus = 'done';
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        this.syncStatus = 'error';
      }
      if (doRefresh) {
        const collection = (await getUserCollection()) || {};
        const currentCategoryImages = collection[this.currentCategory] || [];
        if (JSON.stringify(currentCategoryImages) === JSON.stringify(this.images)) {
          return;
        }
        this.images = [];
        this.waterfallKey += 1;
        this.$nextTick(() => {
          this.images = cloneDeep(currentCategoryImages);
        });
      }
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
