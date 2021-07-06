<template>
  <div :class="['rank-container', iPadStyle ? 'ipad-only' : null]">
    <div class="rank-header">
      <div class="rank-header-title">
        <span>排行榜</span>
        <div class="rank-header-title-category">
          <span>{{ modeText }}</span>
          <el-popover
            placement="bottom"
            popper-class="rank-category-popover"
            width="440"
            trigger="click"
          >
            <ModeSwitcher :mode="mode" @mode-changed="handleModeChanged" />
            <i class="el-icon-refresh" slot="reference"></i>
          </el-popover>
        </div>
        <div class="rank-header-close">
          <i class="el-icon-close" @click="handleBack"></i>
        </div>
      </div>
    </div>
    <div class="rank-body">
      <div class="rank-body-date">
        <div class="rank-body-date-item rank-body-date-back" @click="handleDateChanged(-1)">
          <i class="el-icon-arrow-left"></i>
          <span>{{ backDateText }}{{ dateUnit }}</span>
        </div>
        <el-popover placement="bottom" popper-class="rank-date-popover" width="320" trigger="click">
          <DateSwitcher ref="dateSwitcher" :date="dateObject" @date-selected="handleDateSelected" />
          <div slot="reference" class="rank-body-date-item rank-body-date-date">
            <span>{{ displayDate }}</span>
          </div>
        </el-popover>
        <div
          class="rank-body-date-item rank-body-date-next"
          @click="handleDateChanged(1)"
          v-show="showDateNext"
        >
          <span>{{ nextDateText }}{{ dateUnit }}</span>
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
      <div class="rank-body-content">
        <div class="waterfall-wrapper">
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
        </div>
      </div>
    </div>
    <infinite-loading
      :identifier="waterfallIdentifier"
      @infinite="infiniteHandler"
      spinner="spiral"
    ></infinite-loading>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
import dayjs from 'dayjs';
// Common components
import Waterfall from '../components/common/Waterfall';
import BackToTop from '../components/common/BackToTop';
// Rank components
import ModeSwitcher from '../components/rank/ModeSwitcher';
import DateSwitcher from '../components/rank/DateSwitcher';
// Util
import MobileResponsive from '../util/MobileResponsive';
import { filterImages } from '../util/filter';

export default {
  name: 'Rank',
  components: {
    Waterfall,
    BackToTop,
    ModeSwitcher,
    DateSwitcher,
  },
  data() {
    return {
      // Waterfall Data
      page: this.$store.state.rank.page !== null ? this.$store.state.rank.page : 1,
      dateObject: this.$store.state.rank.date
        ? this.$store.state.rank.date
        : dayjs().subtract(2, 'day'),
      mode: this.initMode() || 'day',
      images: this.$store.state.rank.images ? this.$store.state.rank.images : [],
      // Time
      backDateText: '前一',
      nextDateText: '后一',
      // Misc
      routeFrom: '',
      waterfallIdentifier: Math.round(Math.random() * 100),
      screenWidth: document.documentElement.clientWidth,
      cardWidth: this.getCardWidth(document.documentElement.clientWidth),
      waterfallResponsive: document.documentElement.clientWidth > 767,
      scrollTop: 0,
      // style
      iPadStyle: /iPad/i.test(navigator.userAgent),
    };
  },
  computed: {
    date() {
      return this.dateObject.format('YYYY-MM-DD');
    },
    modeText() {
      const mode2text = {
        day: '日排行榜',
        week: '周排行榜',
        month: '月排行榜',
        day_manga: '漫画日排行榜',
        week_manga: '漫画周排行榜',
        month_manga: '漫画月排行榜',
        week_rookie_manga: '新秀周排行榜',
      };
      return mode2text[this.mode];
    },
    dateUnit() {
      if (this.mode.includes('day')) {
        return '天';
      } else if (this.mode.includes('week')) {
        return '周';
      } else if (this.mode.includes('month')) {
        return '月';
      }
      return this.mode;
    },
    displayDate() {
      if (this.mode.includes('day')) {
        return this.dateObject.format('YYYY-MM-DD');
      } else if (this.mode.includes('week')) {
        return `${this.dateObject.format('YYYY-MM')} 第 ${
          Math.floor(this.dateObject.date() / 7) + 1
        } 周`;
      } else if (this.mode.includes('month')) {
        return this.dateObject.format('YYYY-MM');
      }
      return this.dateObject.format('YYYY-MM-DD');
    },
    showDateNext() {
      return (dayjs().startOf('day').unix() - this.dateObject.unix()) / 86400 > 2;
    },
    mobileWaterfallWidth() {
      return this.cardWidth * 2 + 32;
    },
  },
  watch: {
    /* If changed, then cache it */
    dateObject() {
      this.$store.commit('rank/setDate', this.dateObject);
    },
    page() {
      this.$store.commit('rank/setPage', this.page);
    },
    mode() {
      this.$store.commit('rank/setMode', this.mode);
    },
    /* Watch screen width */
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
          this.cardWidth = this.getCardWidth(this.screenWidth);
          document.documentElement.scrollTop = this.scrollTop;
        });
      }, 300);
    },
  },
  created() {
    // Get cookies
    this.routeFrom = this.$cookies.get('rank-from');
    // 旧版本兼容
    if (this.routeFrom === 'Landing') {
      this.routeFrom = null;
    }
  },
  mounted() {
    // Do scroll when reset is not set
    const scrollTop = parseInt(this.$cookies.get('rank-scroll'), 10);
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
      this.$cookies.set('rank-scroll', 0, '1h');
    }
    // Recheck rank mode
    const reset = this.$cookies.get('rank-reset');
    if (reset === 'true') {
      this.reset();
    }
    this.$cookies.remove('rank-reset');
    // Add window event listener
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    // Change title
    document.title = `${this.modeText} - Pixiviz`;
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('resize', this.windowResized, false);
  },
  methods: {
    infiniteHandler($state) {
      this.axios
        .get(`${this.$config.api_prefix}/illust/rank`, {
          params: {
            mode: this.mode,
            date: this.date,
            page: this.page,
          },
        })
        .then(
          (response) => {
            if (!response.data || !response.data.illusts) {
              // 加载失败
              $state.complete();
              return;
            }
            if (response.data.illusts.length === 0) {
              // 无数据
              $state.complete();
              return;
            }
            const images = filterImages(response.data.illusts);
            this.images = this.images.concat(images);
            // 缓存 images
            this.$store.commit('rank/setImages', this.images);
            // 设置 Load 状态为 false
            if (this.$refs.waterfall) {
              this.$refs.waterfall.firstLoad = false;
            }
            // Page + 1
            this.page += 1;
            // 缓存 page
            this.$store.commit('rank/setPage', this.page);
            $state.loaded();
          },
          () => {
            // 网络错误
            $state.complete();
          },
        );
    },
    refreshWaterfall() {
      this.page = 1;
      this.images = [];
      this.waterfallIdentifier += 1;
      this.$forceUpdate();
    },
    reset() {
      this.page = 1;
      const storedMode = this.$cookies.get('rank-mode');
      this.mode = storedMode || 'day';
      this.dateObject = dayjs().subtract(2, 'day');
      this.images = [];
      this.waterfallIdentifier += 1;
      this.$forceUpdate();
    },
    initMode() {
      const query = this.$route.query.mode;
      if (query) {
        this.$store.commit('rank/setMode', query);
      }
      const stored = this.$store.state.rank.mode;
      if (stored) {
        return stored;
      }
      const cookieStored = this.$cookies.get('rank-mode');
      if (cookieStored) {
        return cookieStored;
      }
      return 'day';
    },
    handleModeChanged(mode) {
      this.mode = mode || 'day';
      document.title = `${this.modeText} - Pixiviz`;
      this.refreshWaterfall();
    },
    handleBack() {
      if (this.routeFrom) {
        this.$router.push(`${this.routeFrom}`);
      } else {
        this.$router.push('/');
      }
    },
    // 日期事件
    handleDateChanged(toward) {
      if (this.dateUnit === '天') {
        this.dateObject = this.dateObject.add(toward * 1, 'day');
      } else if (this.dateUnit === '周') {
        this.dateObject = this.dateObject.add(toward * 1, 'week');
      } else if (this.dateUnit === '月') {
        this.dateObject = this.dateObject.add(toward * 1, 'month');
      }
      this.$refs.dateSwitcher.selectDate = this.dateObject.toDate();
      this.refreshWaterfall();
    },
    handleDateSelected(date) {
      this.dateObject = dayjs(date);
      this.refreshWaterfall();
    },
    // 跳转
    handleCardClicked(imageId) {
      this.$cookies.set('pic-from', 'rank', '1h');
      // 设置图片缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      this.$router.push(`/pic/${imageId}`);
    },
    // 窗口事件
    handleScroll() {
      this.$cookies.set('rank-scroll', document.documentElement.scrollTop, '1h');
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    getCardWidth(width) {
      return MobileResponsive.getCardWidth(width);
    },
  },
};
</script>
