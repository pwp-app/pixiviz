<template>
  <div class="pic-presentation-image-wrapper" :style="{ width: imageWidth + 'px' }">
    <div
      v-loading="imageLoading"
      :element-loading-text="imageLoadingText"
      :class="{
        'pic-presentation-image': true,
        'pic-presentation-image__firstload': imageFirstLoad,
      }"
      :style="imageSizeStyles"
    >
      <img
        ref="image"
        :src="loadingSource"
        :style="imageSizeStyles"
        @click="openLightBox"
        v-context="'context'"
      />
      <div style="clear: both"></div>
      <div class="pic-presentation-image-error" v-if="imageLoadError">
        <div class="pic-presentation-image-error-icon">
          <i class="el-icon-warning-outline" />
        </div>
        <div class="pic-presentation-image-error-tip">
          <span>图片加载失败</span>
        </div>
      </div>
    </div>
    <Paginator
      :page="page"
      :pageCount="image ? image.page_count : 0"
      @page-turn="handlePageChanged"
    />
    <div class="pic-presentation-info" v-if="image">
      <div class="pic-presentation-info-title">
        <span>{{ image ? image.title : '' }}</span>
      </div>
      <div class="pic-presentation-info-caption">
        <span v-html="image ? image.caption : ''"></span>
      </div>
      <div class="pic-presentation-info-tags">
        <div class="pic-tag" v-for="tag in tags" :key="tag.id">
          <span :data-tag="tag.name" @click="handleTagClicked">#{{ tag.name }}</span>
        </div>
      </div>
      <div class="pic-presentation-info-stat">
        <div class="pic-stat">
          <i class="el-icon-view"></i><span>{{ views }}</span>
        </div>
        <div class="pic-stat">
          <i class="el-icon-star-on"></i><span>{{ bookmarks }}</span>
        </div>
      </div>
      <div class="pic-presentation-info-time">
        <span>{{ createTime }}</span>
      </div>
    </div>
    <LightBox
      v-if="lightBoxShow"
      :src="lightBoxSource"
      :isLanding="isLanding"
      :isOverHeight="isOverHeight"
      @loaded="handleLightBoxLoaded"
      @close="onLightBoxClose"
      @download="callDownload"
      @copy="copyImage"
    />
    <ContextMenu ref="context" :width="128" @item-clicked="handleContextClicked">
      <ContextMenuItem name="down">下载</ContextMenuItem>
      <ContextMenuItem name="copy-image" v-if="showCopyImage">复制图片</ContextMenuItem>
    </ContextMenu>
  </div>
</template>

<script>
import CONFIG from '@/config.json';
import dayjs from 'dayjs';
/* Components */
import Paginator from './Pagniator';
import LightBox from './LightBox';

const LARGE_SIZE_LIMIT = 3 * 1024 * 1024;
const BLANK_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default {
  name: 'Pic.Presentation',
  props: ['image', 'block', 'loaded'],
  components: {
    Paginator,
    LightBox,
  },
  data() {
    return {
      sizeCache: {},
      limitWidth: 1152,
      limitHeight: 796,
      screenWidth: document.documentElement.clientWidth,
      screenHeight: document.documentElement.clientHeight,
      imageEl: null,
      loadingSource: BLANK_IMAGE,
      lightBoxSource: '',
      useLarge: false,
      imageSize: {},
      imageObjs: {},
      imageWidth: 0,
      imageHeight: 0,
      imageFirstLoad: false,
      imageFirstLoaded: false,
      imageLoading: true,
      imageLoadError: false,
      page: 1,
      // lightbox
      lightBoxShow: false,
      // context
      showCopyImage: !!window.ClipboardItem,
    };
  },
  beforeCreate() {
    if (window.isSafari) {
      if (!window.pixiviz.downloadQueue) window.pixiviz.downloadQueue = [];
      if (!window.pixiviz.downloadCounter) window.pixiviz.downloadCounter = 0;
    }
  },
  mounted() {
    // image
    this.imageEl = this.$refs.image;
    // 绑定 Resize
    window.addEventListener('resize', this.windowResized, false);
    // 设定初始大小限制
    this.setLimitWidth(this.screenWidth);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.windowResized, false);
    this.cancelAllLoad();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  },
  watch: {
    image: {
      immediate: true,
      handler(image) {
        this.imageLoading = true;
        this.imageLoadError = false;
        this.page = 1;
        this.sizeCache = {};
        this.cancelAllLoad();
        this.imageObjs = {};
        this.imageSize.x = image ? image.width : 0;
        this.imageSize.y = image ? image.height : 0;
        const screenWidth = document.documentElement.clientWidth;
        this.setLimitWidth(screenWidth);
        this.checkMobileMode(screenWidth);
        this.setImageSize(image);
        this.checkFirstLoad(image);
        this.tryLoad();
        this.$emit('image-load');
      },
    },
    screenWidth() {
      this.setLimitWidth();
      this.updateDisplaySize();
    },
  },
  computed: {
    source() {
      if (this.image && this.image.meta_single_page) {
        if (this.block) {
          return BLANK_IMAGE;
        } else if (this.image && this.image.page_count < 2) {
          return this.image.meta_single_page.original_image_url.replace(
            'i.pximg.net',
            CONFIG.IMAGE_PROXY_HOST,
          );
        } else if (this.image && this.image.page_count >= 2) {
          return this.image.meta_pages[this.page - 1].image_urls.original.replace(
            'i.pximg.net',
            CONFIG.IMAGE_PROXY_HOST,
          );
        } else {
          return BLANK_IMAGE;
        }
      } else {
        return BLANK_IMAGE;
      }
    },
    largeSource() {
      return this.getImageSource(this.image, 'large');
    },
    imageSizeStyles() {
      return {
        width: `${this.imageWidth}px`,
        height: `${this.imageHeight}px${!(this.loaded || false) ? ' !important' : ''}`,
      };
    },
    tags() {
      if (this.image) {
        return this.image.tags;
      } else {
        return [];
      }
    },
    views() {
      if (this.image) {
        return this.image.total_view;
      } else {
        return 0;
      }
    },
    bookmarks() {
      if (this.image) {
        return this.image.total_bookmarks;
      } else {
        return 0;
      }
    },
    createTime() {
      if (this.image) {
        return dayjs(this.image.create_date).format('YYYY 年 MM 月 DD 日');
      } else {
        return null;
      }
    },
    isLanding() {
      return this.imageWidth < this.imageHeight;
    },
    isOverHeight() {
      return this.imageHeight / (this.imageWidth / this.screenWidth) > this.screenHeight;
    },
    imageLoadingText() {
      if (this.mobileMode) {
        return `大图加载中（${this.$store.state.pic.progress}%）`;
      } else {
        return null;
      }
    },
  },
  methods: {
    async tryLoad() {
      // init vars
      this.lightBoxSource = '';
      this.useLarge = false;
      // check if existed
      if (this.imageObjs[this.page]) {
        const stored = this.imageObjs[this.page];
        if (/^blob:/.test(stored.src) || stored.lightboxShowed) {
          this.useLarge = !!this.imageObjs[this.page].useLarge;
          this.onLoaded(this.imageObjs[this.page]);
          return;
        }
      }
      this.imageEl && this.imageEl.setAttribute('src', BLANK_IMAGE);
      this.$store.commit('pic/setProgress', 0);
      const img = new Image();
      img.onload = () => this.onLoaded(img);
      img.onerror = () => this.onLoadError();
      const imgSize = await img.getSize(this.source);
      if (imgSize > LARGE_SIZE_LIMIT) {
        img.load(this.largeSource);
        this.useLarge = true;
      } else {
        img.load(this.source);
        // 清理之前的interval重新set
        if (this.progressInterval) {
          clearInterval(this.progressInterval);
          this.progressInterval = null;
        }
        this.progressInterval = setInterval(() => {
          this.progressCheck();
        }, 200);
      }
      this.imageObjs[this.page] = img;
      this.imageObjs[this.page].useLarge = this.useLarge;
    },
    cancelAllLoad() {
      Object.keys(this.imageObjs).forEach((key) => {
        const img = this.imageObjs[key];
        if (!img) {
          return;
        }
        img.cancel();
      });
    },
    progressCheck() {
      if (!this.imageObjs || !this.imageObjs[this.page] || !this.imageObjs[this.page].percent) {
        return;
      }
      this.$store.commit('pic/setProgress', this.imageObjs[this.page].percent);
    },
    onLoaded(img) {
      this.$store.commit('pic/setProgress', 100);
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
        this.loadProgress = 100;
      }
      if (!this.imageFirstLoaded) {
        this.imageFirstLoad = false;
        this.imageFirstLoaded = true;
      }
      this.$emit('image-loaded');
      if (!this.sizeCache[this.page]) {
        this.sizeCache[this.page] = {};
        this.sizeCache[this.page] = {
          x: img.width,
          y: img.height,
        };
      }
      this.imageWidth = this.computeWidth(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
      this.imageHeight = this.computeHeight(
        this.sizeCache[this.page].x,
        this.sizeCache[this.page].y,
      );
      this.imageEl.setAttribute('src', img.src);
      if (this.useLarge) {
        this.lightBoxSource = this.source;
      } else {
        this.lightBoxSource = img.src;
      }
      this.$nextTick(() => {
        this.imageLoading = false;
      });
    },
    onLoadError() {
      this.imageLoading = false;
      this.imageLoadError = true;
    },
    checkMobileMode() {
      const mobileModeCond_1 = window.matchMedia('(orientation: portrait) and (max-width: 1024px)');
      const mobileModeCond_2 = window.matchMedia('(max-width: 767px)');
      if (mobileModeCond_1.matches || mobileModeCond_2.matches) {
        this.mobileMode = true;
      } else {
        this.mobileMode = false;
      }
    },
    setImageSize(image) {
      if (this.mobileMode) {
        this.containerWidth = this.$refs.image
          ? this.$refs.image.clientWidth
          : document.documentElement.clientWidth - 48;
        this.imageWidth = this.containerWidth;
        this.imageHeight = this.computeHeight(image ? image.width : 0, image ? image.height : 0);
      } else {
        this.imageWidth = this.computeWidth(image ? image.width : 0, image ? image.height : 0);
        this.imageHeight = this.computeHeight(image ? image.width : 0, image ? image.height : 0);
      }
    },
    setLimitWidth() {
      const { screenWidth: width, screenHeight: height } = this;
      if (width >= 2400) {
        if (height > 1280) {
          this.limitWidth = 1680;
          this.limitHeight = 960;
        } else {
          this.limitWidth = 1152;
          this.limitHeight = 796;
        }
      } else if (width > 1680 && width <= 1920) {
        this.limitWidth = 1152;
        this.limitHeight = 796;
      } else if (width > 1430 && width <= 1680) {
        this.limitWidth = 920;
        this.limitHeight = 640;
      } else if (width > 1366 && width <= 1430) {
        this.limitWidth = 802;
        this.limitHeight = 580;
      } else if (width > 1024 && width <= 1366) {
        this.limitWidth = 740;
        this.limitHeight = 540;
      } else if (width <= 1024) {
        this.limitWidth = 600;
        this.limitHeight = 480;
      }
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
      this.screenHeight = document.documentElement.clientHeight;
      if (this.image) {
        this.setLimitWidth(this.screenWidth);
        this.checkMobileMode(this.screenWidth);
        this.setImageSize(this.image);
      }
    },
    updateDisplaySize() {
      if (this.sizeCache[this.page]) {
        this.imageWidth = this.computeWidth(
          this.sizeCache[this.page].x,
          this.sizeCache[this.page].y,
        );
        this.imageHeight = this.computeHeight(
          this.sizeCache[this.page].x,
          this.sizeCache[this.page].y,
        );
      } else {
        this.imageWidth = this.computeWidth(this.imageSize.x, this.imageSize.y);
        this.imageHeight = this.computeHeight(this.imageSize.x, this.imageSize.y);
      }
    },
    computeWidth(o_width, o_height) {
      const height = o_height / (o_width / this.limitWidth);
      if (height > this.limitHeight) {
        return o_width / (o_height / this.limitHeight);
      } else {
        return this.limitWidth;
      }
    },
    computeHeight(o_width, o_height) {
      if (!this.mobileMode) {
        const height = o_height / (o_width / this.limitWidth);
        if (height > this.limitHeight) {
          return this.limitHeight;
        } else {
          return height;
        }
      } else {
        return o_height / (o_width / this.containerWidth);
      }
    },
    getImageSource(image, type, useLoadMap = false) {
      let proxyHost;
      if (useLoadMap) {
        if (window.pixiviz.hostMap && window.pixiviz.loadMap) {
          proxyHost = window.pixiviz.hostMap[window.pixiviz.loadMap[image.id]];
        }
      }
      proxyHost = proxyHost || CONFIG.IMAGE_PROXY_HOST;
      if (this.image && this.image.meta_single_page) {
        if (this.block) {
          return BLANK_IMAGE;
        } else {
          let url = BLANK_IMAGE;
          if (this.image && this.image.page_count < 2) {
            url = this.image.image_urls[type].replace('i.pximg.net', proxyHost);
          } else if (this.image && this.image.page_count >= 2) {
            url = this.image.meta_pages[this.page - 1].image_urls[type].replace(
              'i.pximg.net',
              proxyHost,
            );
          }
          if (window.isSafari) {
            url = url.replace('_webp', '');
          }
          return url;
        }
      } else {
        return BLANK_IMAGE;
      }
    },
    checkFirstLoad(image) {
      // 两个false是初始态，后面不可能双false
      if (!this.imageFirstLoad && !this.imageFirstLoaded) {
        this.imageFirstLoad = true;
      }
      if (!this.imageFirstLoad || this.imageFirstLoaded) {
        this.loadingSource = BLANK_IMAGE;
        return;
      }
      this.loadingSource = this.getImageSource(image, 'medium', true);
    },
    handlePageChanged(toward) {
      const prevPageImgObj = this.imageObjs[this.page];
      if (prevPageImgObj) {
        prevPageImgObj.cancel();
      }
      this.page += toward * 1;
      this.tryLoad();
      this.$emit('image-load');
      this.imageLoading = true;
      this.imageLoadError = false;
    },
    handleTagClicked(e) {
      this.$cookies.set('search-from', `pic/${this.image.id}`);
      this.$router.push(`/search/${e.currentTarget.dataset.tag}`);
    },
    handleContextClicked(name) {
      if (name === 'down') {
        this.callDownload();
      } else if (name === 'copy-image') {
        this.copyImage();
      }
    },
    callDownload() {
      this.$emit('download-current');
    },
    async copyImage() {
      if (
        this.imageObjs[this.page].src.startsWith('http') ||
        this.imageObjs[this.page].blob.type !== 'image/png'
      ) {
        // img el to blob
        const image = new Image();
        image.setAttribute('crossOrigin', '*');
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, image.width, image.height);
          canvas.toBlob(async (blob) => {
            // eslint-disable-next-line no-param-reassign
            await navigator.clipboard.write([
              // eslint-disable-next-line no-undef
              new window.ClipboardItem({
                [blob.type]: blob,
              }),
            ]);
          });
        };
        image.load(this.imageObjs[this.page].src);
      } else {
        await navigator.clipboard.write([
          // eslint-disable-next-line no-undef
          new window.ClipboardItem({
            [this.imageObjs[this.page].blob.type]: this.imageObjs[this.page].blob,
          }),
        ]);
      }
      this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `
          <div class="oneline-notice">
            <span data-name="oneline-notice">图片已复制到剪贴板了~</span>
          </div>`,
      });
    },
    // lightbox
    openLightBox() {
      if (this.imageLoading || this.imageLoadError || !this.lightBoxSource) {
        return;
      }
      this.lightBoxShow = true;
      this.$emit('lightbox-open');
    },
    onLightBoxClose() {
      this.lightBoxShow = false;
      this.$emit('lightbox-close');
    },
    handleLightBoxLoaded() {
      if (this.useLarge && this.lightBoxShow) {
        this.imageEl.setAttribute('src', this.lightBoxSource);
        this.imageObjs[this.page].src = this.lightBoxSource;
        this.imageObjs[this.page].useLarge = false;
        this.imageObjs[this.page].lightboxShowed = true;
      }
    },
  },
};
</script>
