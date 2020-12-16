<template>
  <div class="pic-presentation-image-wrapper" :style="{width: imageWidth + 'px'}">
    <div v-loading="imageLoading" class="pic-presentation-image"
      :style="{width: `${imageWidth}px`, height: `${imageHeight}px${!(loaded || false) ? ' !important' : ''}`}">
      <img
        ref="image"
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        :style="{
          width: `${imageWidth}px`,
          height: `${imageHeight}px${!(loaded || false) ? ' !important' : ''}`
        }"
        @click="openLightBox"
        v-context="'context'"
        >
      <div style="clear: both;"></div>
      <div class="pic-presentation-image-error" v-if="imageLoadError">
        <div class="pic-presentation-image-error-icon">
          <i class="el-icon-warning-outline"/>
        </div>
        <div class="pic-presentation-image-error-tip">
          <span>图片加载失败</span>
        </div>
      </div>
    </div>
    <Paginator :page="page" :pageCount="image ? image.page_count : 0" @page-turn="handlePageChanged"/>
    <div class="pic-presentation-info" v-if="image">
      <div class="pic-presentation-info-title">
        <span>{{image ? image.title : ''}}</span>
      </div>
      <div class="pic-presentation-info-caption">
        <span v-html="image ? image.caption : ''"></span>
      </div>
      <div class="pic-presentation-info-tags">
        <div class="pic-tag" v-for="tag in tags" :key="tag.id">
          <span :data-tag="tag.name" @click="handleTagClicked">#{{tag.name}}</span>
        </div>
      </div>
      <div class="pic-presentation-info-stat">
        <div class="pic-stat">
          <i class="el-icon-view"></i><span>{{views}}</span>
        </div>
        <div class="pic-stat">
          <i class="el-icon-star-on"></i><span>{{bookmarks}}</span>
        </div>
      </div>
      <div class="pic-presentation-info-time">
        <span>{{createTime}}</span>
      </div>
    </div>
    <LightBox
      v-if="lightBoxShow"
      :src="lightBoxSource"
      :isLanding="isLanding"
      :isOverHeight="isOverHeight"
      @close="onLightBoxClose"
      @download="callDownload"
      @copy="copyLink"
      />
    <ContextMenu
      ref="context"
      :width="142"
      @item-clicked="handleContextClicked"
      >
      <ContextMenuItem name="down">下载</ContextMenuItem>
      <ContextMenuItem name="copy-link">复制图片链接</ContextMenuItem>
    </ContextMenu>
  </div>
</template>

<script>
import * as clipboard from "clipboard-polyfill/dist/text/clipboard-polyfill.text";
import CONFIG from '@/config.json';
import dayjs from 'dayjs';
/* Components */
import Paginator from './Pagniator';
import LightBox  from './LightBox';

const LARGE_SIZE_LIMIT = 3 * 1024 * 1024;

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
      lightBoxSource: '',
      useLarge: false,
      imageSize: {},
      imageObjs: {},
      imageWidth: 0,
      imageHeight: 0,
      imageLoading: true,
      imageLoadError: false,
      page: 1,
      // lightbox
      lightBoxShow: false,
    }
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
        this.tryLoad();
        this.$emit('image-load');
      }
    },
    screenWidth() {
      this.setLimitWidth();
      this.updateDisplaySize();
    }
  },
  computed: {
    source() {
      if (this.image && this.image.meta_single_page) {
        if (this.block) {
          return '';
        } else {
          if (this.image && this.image.page_count < 2) {
            return this.image.meta_single_page.original_image_url.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
          } else if (this.image && this.image.page_count >= 2) {
            return this.image.meta_pages[this.page - 1].image_urls.original.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
          } else {
            return '';
          }
        }
      } else {
        return '';
      }
    },
    largeSource() {
      if (this.image && this.image.meta_single_page) {
        if (this.block) {
          return '';
        } else {
          if (this.image && this.image.page_count < 2) {
            return this.image.image_urls.large.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
          } else if (this.image && this.image.page_count >= 2) {
            return this.image.meta_pages[this.page - 1].image_urls.large.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
          } else {
            return '';
          }
        }
      } else {
        return '';
      }
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
    }
  },
  methods: {
    async tryLoad() {
      // init vars
      this.lightBoxSource = '';
      this.useLarge = false;
      // check if existed
      if (this.imageObjs[this.page]) {
        const stored = this.imageObjs[this.page];
        if (/^blob:/.test(stored.src)) {
          this.onLoaded(this.imageObjs[this.page]);
          return;
        }
      }
      this.imageEl && this.imageEl.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
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
			this.$emit('image-loaded');
      if (!this.sizeCache[this.page]) {
        this.sizeCache[this.page] = {};
        this.sizeCache[this.page] = {
          x: img.width,
          y: img.height,
        }
      }
      this.imageWidth = this.computeWidth(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
      this.imageHeight = this.computeHeight(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
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
        this.containerWidth = this.$refs.image ? this.$refs.image.clientWidth : document.documentElement.clientWidth - 48;
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
    },
    updateDisplaySize() {
      if (this.sizeCache[this.page]) {
        this.imageWidth = this.computeWidth(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
        this.imageHeight = this.computeHeight(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
      } else {
        this.imageWidth = this.computeWidth(this.imageSize.x, this.imageSize.y);
        this.imageHeight = this.computeHeight(this.imageSize.x, this.imageSize.y);
      }
    },
    computeWidth(o_width, o_height) {
      let height = o_height / (o_width / this.limitWidth);
      if (height > this.limitHeight) {
        return o_width / (o_height / this.limitHeight);
      } else {
        return this.limitWidth;
      }
    },
    computeHeight(o_width, o_height) {
      if (!this.mobileMode) {
        let height = o_height / (o_width / this.limitWidth);
        if (height > this.limitHeight) {
          return this.limitHeight;
        } else {
          return height;
        }
      } else {
        return o_height / (o_width / this.containerWidth);
      }
    },
    handlePageChanged(toward) {
      const prevPageImgObj = this.imageObjs[this.page];
      if (prevPageImgObj) {
        prevPageImgObj.cancel();
      }
      this.page = this.page + toward * 1;
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
      } else if (name === 'copy-link') {
        this.copyLink();
      }
    },
    callDownload() {
      this.$emit('download-current');
    },
    copyLink() {
      navigator.clipboard.writeText(this.source);
      this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `
          <div class="oneline-notice">
            <span data-name="oneline-notice">图片链接已复制到剪贴板~</span>
          </div>`
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
    }
  }
}
</script>
