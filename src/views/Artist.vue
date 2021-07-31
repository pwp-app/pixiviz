<template>
  <div
    :class="{
      'artist-container': true,
      'artist-ipad-only': iPadStyle,
    }"
    v-loading="!infoLoaded"
    element-loading-text="正在获取画师信息"
  >
    <div class="artist-header">
      <div class="artist-header-close">
        <i class="el-icon-close" @click="handleBack"></i>
      </div>
      <ArtistDetail
        ref="detail"
        :artistId="id"
        @loaded="handleInfoLoaded"
        @failed="handleLoadFailed"
      />
    </div>
    <div class="artist-content" v-if="infoLoaded && !infoLoadFailed">
      <div class="waterfall-wrapper">
        <Waterfall
          :class="{
            'waterfall-responsive': waterfallResponsive,
          }"
          ref="waterfall"
          :key="waterfallResponsive"
          :images="images"
          @card-clicked="handleCardClicked"
          :cardWidth="cardWidth"
          imageType="medium"
          :style="waterfallResponsive ? null : { width: `${mobileWaterfallWidth}px` }"
        />
      </div>
    </div>
    <Overlay text="画师信息加载失败" v-if="infoLoadFailed" />
    <infinite-loading
      v-if="!infoLoadFailed"
      :identifier="waterfallIdentifier"
      @infinite="infiniteHandler"
      spinner="spiral"
    ></infinite-loading>
    <BackToTop ref="backToTop" />
  </div>
</template>
<script>
// Common components
import Waterfall from '../components/common/Waterfall';
import BackToTop from '../components/common/BackToTop';
import ArtistDetail from '../components/artist/ArtistDetail';
import Overlay from '../components/pic/Overlay';
// Util
import MobileResponsive from '../util/MobileResponsive';
import { filterImages } from '../util/filter';
import { getOgTags, setOgTags } from '../util/og';

export default {
  name: 'Artist',
  components: {
    Waterfall,
    BackToTop,
    ArtistDetail,
    Overlay,
  },
  data() {
    return {
      page: this.initPage(),
      images: this.initImages(),
      id: this.$route.params.id,
      artistName: null,
      infoLoaded: false,
      infoLoadFailed: false,
      // waterfall
      waterfallIdentifier: Math.round(Math.random() * 100),
      // Misc
      screenWidth: document.documentElement.clientWidth,
      cardWidth: this.getCardWidth(document.documentElement.clientWidth),
      waterfallResponsive: document.documentElement.clientWidth > 767,
      scrollTop: 0,
      // style
      iPadStyle: /iPad/i.test(navigator.userAgent),
    };
  },
  watch: {
    /* Watch screen width */
    screenWidth(width) {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        this.screenWidth = width;
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
    mobileWaterfallWidth() {
      return this.cardWidth * 2 + 32;
    },
  },
  mounted() {
    // update store
    this.$store.commit('artist/setId', this.id);
    // Add resize event listener
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    // Set scroll to last state
    const scrollTop = parseInt(this.$cookies.get('artist-scroll'), 10);
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
      this.$cookies.set('artist-scroll', 0, '1h');
    }
    // change title
    if (this.artistName) {
      document.title = `${this.artistName} - Pixiviz`;
    } else {
      document.title = `画师${this.id || ''} - Pixiviz`;
    }
    // set og tag
    this.setOgTagData();
    // 路由数据栈检查
    const storedRoutes = window.localStorage.getItem('pic-routes');
    const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
    if (routes && routes.length > 0) {
      const prev = routes.pop();
      if (prev.type === 'artist' && prev.from === this.id) {
        routes.mtime = Date.now();
        window.localStorage.setItem('pic-routes', JSON.stringify(routes));
      }
    }
  },
  beforeDestroy() {
    // 清除监听器
    window.removeEventListener('resize', this.windowResized, false);
    window.removeEventListener('scroll', this.handleScroll, false);
  },
  methods: {
    initPage() {
      const storedPage = this.$store.state.artist.page[this.$route.params.id];
      if (storedPage) {
        return storedPage;
      }
      return 1;
    },
    initImages() {
      const storedImages = this.$store.state.artist.images[this.$route.params.id];
      if (storedImages) {
        return storedImages;
      }
      return [];
    },
    // 瀑布流
    infiniteHandler($state) {
      // 没有数据不发包
      if (!this.id) {
        $state.complete();
        return;
      }
      this.axios
        .get(`${this.$config.api_prefix}/user/illusts`, {
          params: {
            id: this.id,
            page: this.page,
          },
        })
        .then(
          (response) => {
            if (!response.data.illusts) {
              // 加载失败
              $state.complete();
              return;
            }
            if (response.data.illusts.length === 0) {
              // 无数据
              $state.complete();
              return;
            }
            const images = filterImages(response.data.illusts, false);
            this.images = this.images.concat(images);
            // 缓存 images
            this.$store.commit('artist/setImages', {
              id: this.id,
              images: this.images,
            });
            // 设置 Load 状态为 false
            if (this.$refs.waterfall) {
              this.$refs.waterfall.firstLoad = false;
            }
            // Page + 1
            this.page += 1;
            this.$store.commit('artist/setPage', {
              id: this.id,
              page: this.page,
            });
            $state.loaded();
          },
          () => {
            $state.complete();
          },
        );
    },
    handleCardClicked(imageId) {
      // 设置图片缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      // 设置路由信息
      const storedRoutes = window.localStorage.getItem('pic-routes');
      const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
      routes.push({
        type: 'artist',
        from: this.id,
      });
      routes.mtime = Date.now();
      window.localStorage.setItem('pic-routes', JSON.stringify(routes));
      this.$router.push(`/pic/${imageId}`);
    },
    // info
    handleInfoLoaded(name) {
      this.infoLoaded = true;
      this.artistName = name;
      document.title = `${name} - Pixiviz`;
      this.setOgTagData();
    },
    handleLoadFailed() {
      this.infoLoaded = true;
      this.infoLoadFailed = true;
    },
    // 组件
    handleBack() {
      const storedRoutes = window.localStorage.getItem('pic-routes');
      const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
      if (routes.length < 1) {
        this.$router.push('/');
        return;
      }
      const prev = routes.pop();
      if (prev.type === 'pic') {
        routes.mtime = Date.now();
        window.localStorage.setItem('pic-routes', JSON.stringify(routes));
        const info = window.pixiviz.infoMap[prev.from];
        if (info) {
          this.$store.commit('imageCache/setCache', info);
        }
        this.$router.push(`/pic/${prev.from}`);
      } else if (prev.type === 'usearch') {
        routes.mtime = Date.now();
        window.localStorage.setItem('pic-routes', JSON.stringify(routes));
        this.$router.push(`/usearch/${prev.keyword}`);
      } else {
        window.localStorage.removeItem('pic-routes');
        this.$router.push('/');
      }
    },
    // 窗口事件
    handleScroll() {
      this.$cookies.set('artist-scroll', document.documentElement.scrollTop, '1h');
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    getCardWidth(width) {
      return MobileResponsive.getCardWidth(width);
    },
    // og tags
    setOgTagData() {
      let comment;
      if (this.$refs.detail) {
        comment = this.$refs.detail.getComment();
      }
      setOgTags(getOgTags(), {
        ogTitle: this.artistName
          ? `${this.artistName} - Pixiviz`
          : `画师${this.id || ''} - Pixiviz`,
        // eslint-disable-next-line no-nested-ternary
        ogDesc: comment
          ? comment.length > 50
            ? comment.substr(0, 50)
            : comment
          : `二次元插画分享，跨次元链接，就在 Pixiviz`,
        ogUrl: window.location.href,
        // eslint-disable-next-line no-undef
        ogImage: `${this.$config.website_url}/favicon.png`,
      });
    },
  },
};
</script>
