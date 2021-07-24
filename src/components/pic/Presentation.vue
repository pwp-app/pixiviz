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
        v-if="!isUgoira || !ugoiraLoaded"
      />
      <img ref="image" :src="ugoiraSource" :style="imageSizeStyles" v-else />
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
      :isMobileOverHeight="isMobileOverHeight"
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
import dayjs from 'dayjs';
import Paginator from './Pagniator';
import LightBox from './LightBox';
import Ugoira from '../../util/ugoira';
import { weightedRandom } from '../../util/random';
import { getHistoryTop, addUserHistory } from '../../util/history';

const LARGE_SIZE_LIMIT = 3 * 1024 * 1024;
const BLANK_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default {
  name: 'Pic.Presentation',
  props: {
    image: {
      type: Object,
    },
    block: {
      type: Boolean,
    },
    loaded: {
      type: Boolean,
    },
  },
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
      // ugoira
      isUgoira: false,
      ugoira: null,
      ugoiraSource: BLANK_IMAGE,
      ugoiraLoaded: false,
      ugoiraObserver: window.IntersectionObserver
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && this.ugoira && this.ugoira.status === 'stopped') {
                this.ugoira.play();
                return;
              }
              if (!entry.isIntersecting && this.ugoira && this.ugoira.status === 'playing') {
                this.ugoira.stop();
              }
            });
          })
        : null,
    };
  },
  beforeCreate() {
    if (window.isSafari) {
      if (!window.pixiviz.downloadQueue) window.pixiviz.downloadQueue = [];
      if (!window.pixiviz.downloadCounter) window.pixiviz.downloadCounter = 0;
    }
  },
  created() {
    this.$bus.$on('download-ugoira', this.downloadUgoira);
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
    this.$bus.$off('download-ugoira', this.downloadUgoira);
  },
  watch: {
    image: {
      immediate: true,
      handler(image) {
        // ugoira observer
        if (this.$refs.image) {
          this.ugoiraObserver && this.ugoiraObserver.unobserve(this.$refs.image);
        }
        // init vars
        this.imageLoading = true;
        this.imageLoadError = false;
        this.page = 1;
        this.sizeCache = {};
        this.cancelAllLoad();
        this.imageObjs = {};
        this.imageSize.x = image ? image.width : 0;
        this.imageSize.y = image ? image.height : 0;
        // ugoira
        if (image.type === 'ugoira') {
          this.isUgoira = true;
        } else {
          this.isUgoira = false;
        }
        if (this.ugoira) {
          this.ugoira.stop();
          this.ugoira = null;
        }
        this.ugoiraSource = BLANK_IMAGE;
        this.ugoiraLoaded = false;
        // progress
        this.$store.commit('pic/setProgress', 0);
        this.$store.commit('pic/setUgoiraProgress', 0);
        this.$store.commit('pic/setUgoiraStatus', null);
        // width limit
        const screenWidth = document.documentElement.clientWidth;
        this.setLimitWidth(screenWidth);
        this.checkMobileMode(screenWidth);
        this.setImageSize(image);
        this.checkFirstLoad(image);
        // start loading
        this.tryLoad();
        this.$emit('image-load');
        // set user history
        this.pushUserHistory(image);
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
            this.getProxyHost(this.image.id),
          );
        } else if (this.image && this.image.page_count >= 2) {
          return this.image.meta_pages[this.page - 1].image_urls.original.replace(
            'i.pximg.net',
            this.getProxyHost(this.image.id),
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
      const styles = {
        width: `${this.imageWidth}px`,
        height: `${this.imageHeight}px${!(this.loaded || false) ? ' !important' : ''}`,
      };
      if (this.isUgoira) {
        Object.assign(styles, {
          transform: 'translate3d(0, 0, 0);',
          cursor: 'default;',
        });
      }
      return styles;
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
    // after rotated, image height greater than 100vw
    isMobileOverHeight() {
      return this.imageWidth / (this.imageHeight / this.screenHeight) > this.screenHeight;
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
      // ugoira
      if (this.isUgoira) {
        this.getUgoira();
      }
    },
    async getUgoira() {
      // get ugoira meta
      let metaRes;
      try {
        metaRes = await this.axios.get(`${this.$config.api_prefix}/ugoira/meta`, {
          params: {
            id: this.image.id,
          },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch ugoira meta data.', err);
      }
      const { ugoira_metadata: meta } = metaRes.data;
      const { zip_urls: zipUrls } = meta;
      // download zip
      this.ugoira = new Ugoira({
        url: this.getUgoiraSource(zipUrls.original || zipUrls.medium),
        frames: meta.frames,
      });
      this.ugoiraProgressInterval = setInterval(() => {
        this.$store.commit('pic/setUgoiraProgress', this.ugoira.progress);
      }, 200);
      this.ugoira.onFrame = (url) => {
        this.ugoiraSource = url;
      };
      const ret = await this.ugoira.load();
      if (!ret) {
        clearInterval(this.ugoiraProgressInterval);
        this.$store.commit('pic/setUgoiraProgress', 0);
        this.$store.commit('pic/setUgoiraStatus', 'downloadFailed');
        return;
      }
      this.$store.commit('pic/setUgoiraProgress', 99);
      this.$store.commit('pic/setUgoiraStatus', 'unzip');
      clearInterval(this.ugoiraProgressInterval);
      try {
        const parseRet = await this.ugoira.parse();
        if (!parseRet) {
          this.$store.commit('pic/setUgoiraProgress', 0);
          this.$store.commit('pic/setUgoiraStatus', 'unzipFailed');
          return;
        }
      } catch {
        this.$store.commit('pic/setUgoiraProgress', 0);
        this.$store.commit('pic/setUgoiraStatus', 'unzipFailed');
        return;
      }
      this.$store.commit('pic/setUgoiraProgress', 100);
      this.$store.commit('pic/setUgoiraStatus', null);
      this.$bus.$emit('ugoira-loaded', this.image.id);
      this.ugoiraLoaded = true;
      this.ugoira.play();
      this.$nextTick(() => {
        // observe the image el
        this.ugoiraObserver && this.ugoiraObserver.observe(this.$refs.image);
      });
    },
    downloadUgoira() {
      if (!this.ugoira) {
        return;
      }
      const gif = new window.GIF({
        worker: 10,
        workerScript: '/js/gif.worker.js',
        quality: this.mobileMode ? 5 : 2,
        width: this.image.width,
        height: this.image.height,
        background: '#fff',
      });
      this.$store.commit('pic/setUgoiraStatus', 'renderGif');
      // render gif
      const images = [];
      const addFrames = () => {
        images.sort((a, b) => {
          return a.index - b.index;
        });
        images.forEach((item, index) => {
          gif.addFrame(item.img, {
            delay: this.ugoira.frames[index].delay,
            width: this.image.width,
            height: this.image.height,
          });
        });
        gif.render();
      };
      try {
        this.ugoira.frames.forEach((frame, index) => {
          const img = new Image();
          img.src = this.ugoira.blobMap[frame.file];
          img.onload = () => {
            images.push({ img, index });
            if (images.length === this.ugoira.frames.length) {
              addFrames();
            }
          };
        });
        gif.on('finished', (blob) => {
          this.$store.commit('pic/setUgoiraStatus', null);
          this.$bus.$emit('ugoira-gif-rendered', window.URL.createObjectURL(blob));
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Cannot generate gif.', err);
        this.$store.commit('pic/setUgoiraStatus', null);
        this.$message.error('动图GIF生成失败，请重试');
      }
    },
    cancelAllLoad() {
      if (!this.imageObjs) {
        return;
      }
      Object.keys(this.imageObjs).forEach((key) => {
        const img = this.imageObjs[key];
        if (!img) {
          return;
        }
        img.cancel();
      });
      if (this.ugoira) {
        this.ugoira.cancel();
      }
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
    getPage() {
      return this.page;
    },
    getProxyHost(imageId) {
      const hosts = this.$config.download_proxy_host;
      if (typeof hosts !== 'object') {
        return hosts;
      }
      // random pick a host
      const [host, hostIdx] = weightedRandom(hosts);
      if (!this.$loadMap[imageId]) {
        this.$loadMap[imageId] = {};
      }
      Object.assign(this.$loadMap[imageId], {
        downloadHostIdx: hostIdx,
        time: Date.now(),
      });
      this.$bus.$emit('save-loadmap');
      return host;
    },
    getImageSource(image, type, page = this.page, useLoadMap = true, usePublicProxy = false) {
      const imageHosts = this.$config.image_proxy_host;
      const downloadHosts = this.$config.download_proxy_host;
      let proxyHost;
      if (useLoadMap) {
        const record = this.$loadMap[image.id];
        if (record) {
          // check if exists
          let recordHost;
          if (type === 'medium' && record.hostIdx) {
            recordHost = typeof imageHosts === 'object' ? imageHosts[record.hostIdx] : imageHosts;
          } else if (record.downloadHostIdx) {
            recordHost =
              typeof downloadHosts === 'object'
                ? downloadHosts[record.downloadHostIdx]
                : downloadHosts;
          }
          if (recordHost) {
            record.time = Date.now();
            proxyHost = recordHost;
          }
        }
      }
      proxyHost = usePublicProxy ? this.$config.public_proxy : proxyHost || this.getProxyHost(image.id);
      if (image && image.meta_single_page) {
        if (this.block) {
          return BLANK_IMAGE;
        } else {
          let url = BLANK_IMAGE;
          if (image && image.page_count < 2) {
            url = image.image_urls[type].replace('i.pximg.net', proxyHost);
          } else if (image && image.page_count >= 2) {
            url = image.meta_pages[page - 1].image_urls[type].replace('i.pximg.net', proxyHost);
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
    getUgoiraSource(zipUrl) {
      const hosts = this.$config.image_proxy_host;
      let proxyHost;
      if (typeof hosts === 'object') {
        const record = this.$loadMap[this.image.id];
        if (record) {
          // check if exists
          let recordHost;
          if (record.downloadHostIdx) {
            recordHost = typeof hosts === 'object' ? hosts[record.downloadHostIdx] : hosts;
          }
          if (recordHost) {
            record.time = Date.now();
            proxyHost = recordHost;
          }
        }
      }
      proxyHost = proxyHost || this.getProxyHost(this.image.id);
      return zipUrl.replace('i.pximg.net', proxyHost);
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
      this.loadingSource = this.getImageSource(image, 'medium');
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
        const writeClipboard = () => {
          return new Promise((resolve) => {
            const image = new Image();
            const notifyTimeout = setTimeout(() => {
              this.$notify({
                title: '',
                position: 'top-right',
                customClass: 'oneline-notice-container',
                dangerouslyUseHTMLString: true,
                duration: 3000,
                message: `
                <div class="oneline-notice">
                  <span data-name="oneline-notice">图片复制中，请不要切到其他窗口~</span>
                </div>`,
              });
            }, 500);
            image.setAttribute('crossOrigin', '*');
            image.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const context = canvas.getContext('2d');
              context.drawImage(image, 0, 0, image.width, image.height);
              canvas.toBlob(async (blob) => {
                // eslint-disable-next-line no-param-reassign
                try {
                  await navigator.clipboard.write([
                    // eslint-disable-next-line no-undef
                    new window.ClipboardItem({
                      [blob.type]: blob,
                    }),
                  ]);
                  clearTimeout(notifyTimeout);
                  resolve();
                } catch (err) {
                  this.$notify({
                    title: '',
                    position: 'top-right',
                    customClass: 'oneline-notice-container',
                    dangerouslyUseHTMLString: true,
                    duration: 5000,
                    message: `
                    <div class="oneline-notice">
                      <span data-name="oneline-notice">图片复制失败，复制成功前请不要切窗口</span>
                    </div>`,
                  });
                  throw err;
                }
              });
            };
            image.load(this.imageObjs[this.page].src);
          });
        };
        await writeClipboard();
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
      // disable scrolling
      document.documentElement.classList.add('no-scrollbar');
    },
    onLightBoxClose() {
      this.lightBoxShow = false;
      this.$emit('lightbox-close');
      document.documentElement.classList.remove('no-scrollbar');
    },
    handleLightBoxLoaded() {
      if (this.useLarge && this.lightBoxShow) {
        this.imageEl.setAttribute('src', this.lightBoxSource);
        this.imageObjs[this.page].src = this.lightBoxSource;
        this.imageObjs[this.page].useLarge = false;
        this.imageObjs[this.page].lightboxShowed = true;
      }
    },
    // user history
    async pushUserHistory(image) {
      const historyTop = getHistoryTop();
      if (historyTop && historyTop.id === image.id) {
        return;
      }
      await addUserHistory(image);
    },
  },
};
</script>
