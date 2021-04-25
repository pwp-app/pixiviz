<template>
  <div
    :class="[
      'pic-container',
      infoLoading ? 'pic-container-loading' : null,
      block || loadFailed ? 'pic-container-failed' : null,
      lightboxShow ? 'pic-container-lockscroll' : null,
    ]"
    v-loading="infoLoading"
    element-loading-text="正在获取画作信息"
  >
    <div class="pic" v-if="!infoLoading">
      <div class="pic-presentation">
        <Presentation
          ref="presentation"
          v-show="image"
          :image="image"
          :block="block"
          :loaded="imageLoaded"
          @image-load="handleImageLoad"
          @image-loaded="handleImageLoaded"
          @download-current="startDownloadCurrent"
          @lightbox-open="handleLightBoxOpen"
          @lightbox-close="handleLightBoxClose"
        />
      </div>
      <div class="pic-side">
        <Author
          :author="author"
          :imageId="image ? image.id : null"
          v-show="author"
          @navigate="handleArtistNavigate"
        />
        <Download
          ref="download"
          v-show="image"
          :image="image"
          :loaded="imageLoaded"
          @download-current="startDownloadCurrent"
        />
        <Related
          ref="related"
          v-show="relatedImages.length > 0"
          :key="showPart"
          :images="showPart ? imageSlice : relatedImages"
          :oimages="relatedImages"
          :page="relatedPage"
          :offset="pageOffset"
          :completed="relatedCompleted"
          @go="handleRelatedPageChanged"
          @infite-load="handleRelatedInfiniteLoad"
          @change-page-size="handlePageSizeChanged"
          :orientation="screenOrientation"
        />
      </div>
    </div>
    <Overlay text="图片无法展示" v-if="block" />
    <Overlay text="图片信息加载失败" v-if="loadFailed" :showRefresh="true" />
    <div class="pic-close" @click="handleClose">
      <i class="el-icon-close"></i>
    </div>
    <div
      :class="['pic-action', actionShowClass ? 'pic-action-show' : null]"
      v-if="!infoLoading && actionShow"
    >
      <HomeIcon @action="handleAction" />
      <RankIcon @action="handleAction" />
      <LinkIcon @action="handleAction" />
      <BackIcon @action="handleAction" />
    </div>
  </div>
</template>

<script>
import Presentation from '../components/pic/Presentation';
import Author from '../components/pic/Author';
import Download from '../components/pic/Download';
import Related from '../components/pic/Related';
import Overlay from '../components/pic/Overlay';

// utils
import { filterImages } from '../util/filter';

// icons
import HomeIcon from '../components/icons/home';
import RankIcon from '../components/icons/rank';
import LinkIcon from '../components/icons/link';
import BackIcon from '../components/icons/back';

import * as clipboard from 'clipboard-polyfill/text';

export default {
  name: 'Pic',
  data() {
    return {
      image: null,
      infoLoading: true,
      loadFailed: false,
      block: false,
      imageLoaded: false,
      relatedImages: [],
      relatedLoading: false,
      relatedCompleted: false,
      relatedPage: 1,
      relatedPageSize: 6,
      realRelatedPage: 1,
      pageOffset: 0,
      from: this.$cookies.get('pic-from'),
      // screen
      screenOrientation: window.orientation,
      showPart: window.orientation !== 0,
      // action
      lastOffset: 0,
      actionShow: false,
      actionShowClass: false,
      link: window.location.href,
      // lightbox
      lightboxShow: false,
      // mobile download
      mobileDownload: false,
    };
  },
  components: {
    // parts
    Presentation,
    Author,
    Download,
    Related,
    Overlay,
    // icons
    HomeIcon,
    RankIcon,
    LinkIcon,
    BackIcon,
  },
  computed: {
    imageId() {
      return this.$route.params.id;
    },
    imageSlice() {
      return this.relatedImages.slice(
        (this.relatedPage - 1) * this.relatedPageSize,
        this.relatedPage * this.relatedPageSize,
      );
    },
    author() {
      if (this.image && this.image.user) {
        return this.image.user;
      } else {
        return null;
      }
    },
  },
  mounted() {
    // fetch image info
    if (this.image === null) {
      this.fetchInfo();
      document.title = `图片${this.imageId} - Pixiviz`;
    } else {
      document.title = `${this.image.title} - Pixiviz`;
    }
    // float
    this.showFloatTimeout = setTimeout(() => {
      this.showActionFloat();
    }, 2000);
    // add event listener
    window.addEventListener('orientationchange', this.handleScreenRotate, false);
    window.addEventListener('scroll', this.handleScroll);
    // scroll to top
    window.scrollTo({
      top: 0,
    });
    this.lastOffset = 0;
    // 路由数据栈检查，用户可能是通过浏览器back的
    const storedRoutes = window.localStorage.getItem('pic-routes');
    const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
    if (routes && routes.length > 0) {
      const prev = routes.pop();
      if (prev.type === 'pic' && prev.from === this.imageId) {
        window.localStorage.setItem('pic-routes', JSON.stringify(routes));
      }
    }
    // 检查二维码下载
    if (this.$route.query && this.$route.query.mobileDownload === 'true') {
      this.mobileDownload = true;
      this.$router.replace({
        query: null,
      });
    }
  },
  destroyed() {
    window.removeEventListener('orientationchange', this.handleScreenRotate, false);
    window.removeEventListener('scroll', this.handleScroll);
  },
  watch: {
    '$route.params.id': 'handleIdChanged',
  },
  methods: {
    fetchInfo() {
      // 检查缓存
      if (this.$store.state.imageCache.image) {
        this.image = this.$store.state.imageCache.image;
        this.afterLoad();
        // 用完就丢
        this.$store.commit('imageCache/destroy');
        this.infoLoading = false;
        return;
      }
      this.axios
        .get(`${this.$config.api_prefix}/illust/detail`, {
          params: {
            id: this.imageId,
          },
        })
        .then(
          (response) => {
            if (!response.data || !response.data.illust) {
              this.infoLoading = false;
              this.loadFailed = true;
              return;
            }
            this.infoLoading = false;
            this.image = response.data.illust;
            this.afterLoad();
          },
          () => {
            this.infoLoading = false;
            this.loadFailed = true;
          },
        );
    },
    afterLoad() {
      if (parseInt(this.image.x_restrict, 10) === 1 || this.image.sanity_level > 5) {
        this.block = true;
      }
      // fetch related
      this.fetchRelated();
      // change title
      this.$nextTick(() => {
        document.title = `${this.image.title} - Pixiviz`;
        if (this.mobileDownload) {
          this.mobileDownload = false;
          this.startDownloadCurrent();
        }
      });
    },
    startDownloadCurrent() {
      const url = this.$refs.presentation.source;
      const { page } = this.$refs.presentation;
      if (page > 1) {
        const name = this.$refs.download.getDownloadName('multi');
        this.$refs.download.downloadImage(url, name.replace('{index}', page));
      } else {
        const name = this.$refs.download.getDownloadName('single');
        this.$refs.download.downloadImage(url, name);
      }
    },
    fetchRelated(state) {
      this.relatedLoading = true;
      this.axios
        .get(`${this.$config.api_prefix}/illust/related`, {
          params: {
            id: this.imageId,
            page: this.realRelatedPage,
          },
        })
        .then(
          (response) => {
            if (!response.data.illusts || response.data.illusts.length === 0) {
              this.relatedLoading = false;
              this.relatedCompleted = true;
              if (state) state.complete();
              return;
            }
            const images = filterImages(response.data.illusts);
            this.relatedImages = this.relatedImages.concat(images);
            this.relatedLoading = false;
            if (state) {
              state.loaded();
            }
          },
          () => {
            // 针对加载失败的情况
            this.relatedLoading = false;
            this.relatedCompleted = true;
            if (state) state.complete();
          },
        );
    },
    handleIdChanged() {
      this.infoLoading = true;
      this.downloadStarted = false;
      this.fetchInfo();
      // 重置related
      this.relatedPage = 1;
      this.realRelatedPage = 1;
      this.relatedImages = [];
      // change title
      document.title = `图片${this.imageId} - Pixiviz`;
      // reset var
      this.lastOffset = 0;
      this.closeActionFloat();
    },
    handleImageLoad() {
      setTimeout(() => {
        this.imageLoaded = false;
        this.$forceUpdate();
      }, 50);
    },
    handleImageLoaded() {
      this.imageLoaded = true;
    },
    handlePageSizeChanged(size) {
      this.relatedPageSize = size;
    },
    handleRelatedPageChanged(toward) {
      if (toward < 0) {
        this.relatedPage -= 1;
      } else if (
        this.relatedPage * this.relatedPageSize >=
        this.relatedImages.length - this.relatedPageSize
      ) {
        // 提前2页load
        if (!this.relatedLoading) {
          this.realRelatedPage += 1;
          this.fetchRelated();
        }
      } else {
        this.relatedPage += 1;
      }
    },
    handleScreenRotate() {
      if (this.screenOrientation === 0 && window.orientation !== 0) {
        // 切割显示的数组
        this.showPart = true;
      } else if (this.screenOrientation !== 0 && window.orientation === 0) {
        this.showPart = false;
      }
      this.screenOrientation = window.orientation;
    },
    handleRelatedInfiniteLoad(state) {
      this.realRelatedPage += 1;
      this.fetchRelated(state);
    },
    handleArtistNavigate(id) {
      const storedRoutes = window.localStorage.getItem('pic-routes');
      const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
      if (routes.length < 1) {
        routes.push({
          type: 'entry',
          from: this.from,
        });
      }
      routes.push({
        type: 'pic',
        from: this.imageId,
      });
      window.localStorage.setItem('pic-routes', JSON.stringify(routes));
      this.$router.push(`/artist/${id}`);
    },
    handleClose() {
      const storedRoutes = window.localStorage.getItem('pic-routes');
      const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
      if (routes.length < 1) {
        this.$router.push(this.from ? `/${this.from}` : '/');
        return;
      }
      const prev = routes.pop();
      if (prev.type === 'entry') {
        window.localStorage.removeItem('pic-routes');
        this.$router.push(`/${prev.from}`);
      } else if (prev.type === 'artist') {
        window.localStorage.setItem('pic-routes', JSON.stringify(routes));
        this.$router.push(`/artist/${prev.from}`);
      } else {
        // 不符合正常跳转逻辑，直接回首页，清掉路由
        window.localStorage.removeItem('pic-routes');
        this.$router.push('/');
      }
    },
    handleLightBoxOpen() {
      this.lightboxShow = true;
    },
    handleLightBoxClose() {
      this.lightboxShow = false;
    },
    // action
    closeActionFloat() {
      if (this.actionShowClass) {
        this.actionShowClass = false;
        setTimeout(() => {
          this.actionShow = false;
          if (this.showFloatTimeout) {
            clearTimeout(this.showFloatTimeout);
            this.showFloatTimeout = null;
          }
        }, 300);
      }
    },
    showActionFloat() {
      if (!this.actionShow) {
        this.actionShow = true;
        setTimeout(() => {
          this.actionShowClass = true;
        }, 100);
      }
    },
    handleScroll() {
      const { scrollTop } = document.documentElement;
      if (window.pageYOffset - this.lastOffset < 0 && scrollTop > 200) {
        this.closeActionFloat();
      }
      if (this.showFloatTimeout) {
        clearTimeout(this.showFloatTimeout);
        this.showFloatTimeout = null;
      }
      this.showFloatTimeout = setTimeout(() => {
        this.showActionFloat();
      }, 1500);
      this.lastOffset = window.pageYOffset;
    },
    handleAction(action) {
      switch (action) {
        case 'home':
          this.$router.push('/');
          break;
        case 'rank':
          this.$router.push('/rank');
          break;
        case 'copy-image':
          clipboard.writeText(window.location.href);
          this.$notify({
            title: '',
            position: 'top-right',
            customClass: 'oneline-notice-container',
            dangerouslyUseHTMLString: true,
            duration: 2000,
            message: `
              <div class="oneline-notice">
                <span data-name="oneline-notice">当前页面的链接已复制到剪贴板~</span>
              </div>`,
          });
          break;
        case 'back':
          this.handleClose();
          break;
        default:
          // do nothing
          break;
      }
    },
  },
};
</script>
