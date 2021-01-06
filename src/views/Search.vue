<template>
  <div
    :class="['search-container', iPadStyle ? 'ipad-only' : null]"
    :style="keywordBlocked ? { filter: `blur(${blockedCount / 3}px`} : null"
  >
    <div class="search-header">
      <div class="search-header-title">
        <span>搜索</span>
      </div>
      <div class="search-header-input">
        <el-input
          placeholder="输入搜索关键词"
          v-model="keywordInput"
          spellcheck="false"
          @keyup.enter.native="submitSearch"
        >
          <i slot="prefix" class="el-input__icon el-icon-search"></i>
        </el-input>
      </div>
      <div class="search-header-close">
        <i class="el-icon-close" @click="handleBack"></i>
      </div>
    </div>
    <div
      class="search-suggestion"
      ref="suggestions"
      @mouseenter="enterSuggesion"
      @mouseleave="leaveSuggestion"
      v-if="suggestions.length > 0 && showContent"
    >
      <div class="search-suggestion-items" ref="suggestionItems">
        <div
          class="search-suggestion-item"
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="handleSuggestionClick(suggestion)"
        >
          <span>{{ suggestion }}</span>
        </div>
      </div>
    </div>
    <div class="search-content" v-if="showContent">
      <div class="waterfall-wrapper">
        <Waterfall
          :class="{
            'waterfall-responsive': waterfallResponsive
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
    <div class="search-content search-content-blocked" v-if="keywordBlocked">
      <p>别搜了，这里真的没有色图...</p>
    </div>
    <div class="search-content search-content-blocked" v-if="sensitiveBlocked">
      <p>富强、民主、文明、和谐</p>
      <p>自由、平等、公正、法制</p>
      <p>爱国、敬业、诚信、友善</p>
    </div>
    <infinite-loading
      :identifier="waterfallIdentifier"
      @infinite="infiniteHandler"
      spinner="spiral"
      v-if="showContent"
    ></infinite-loading>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
// Common components
import Waterfall from "../components/common/Waterfall";
import BackToTop from "../components/common/BackToTop";
// Util
import MobileResponsive from "../util/MobileResponsive";
// config
import CONFIG from '../config.json';

const id_matcher = /^\d{2,8}$/;

// block words
const BLOCK_WORDS = [/r-?18/i, /18-?r/i, /^色图$/];

export default {
  name: "Search",
  components: {
    Waterfall,
    BackToTop
  },
  data() {
    return {
      page: this.$store.state.search.page !== null ? this.$store.state.search.page : 1,
      images: this.$store.state.search.keyword === this.$route.params.keyword ?
        this.$store.state.search.images ? this.$store.state.search.images : [] : [],
      suggestions: this.$store.state.search.suggestions ? this.$store.state.search.suggestions : [],
      keyword: this.$route.params.keyword,
      keywordInput: this.$route.params.keyword,
      keywordBlocked: false,
      sensitiveBlocked: false,
      blockedCount: 0,
      waterfallIdentifier: Math.round(Math.random() * 100),
      from: this.$cookies.get("search-from"),
      // Misc
      screenWidth: document.documentElement.clientWidth,
      cardWidth: this.getCardWidth(document.documentElement.clientWidth),
      waterfallResponsive: document.documentElement.clientWidth > 767,
      scrollTop: 0,
      suggestionTranslate: 0,
      // style
      iPadStyle: /iPad/i.test(navigator.userAgent),
      // notification
      illustNotice: null,
      artistNotice: null,
    };
  },
  watch: {
    "$route.params.keyword": "handleKeywordChanged",
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
    }
  },
  computed: {
    showContent() {
      return !this.keywordBlocked && !this.sensitiveBlocked;
    },
    mobileWaterfallWidth() {
      return this.cardWidth * 2 + 32;
    },
  },
  mounted() {
    // 检查屏蔽
    this.checkBlocked();
    // 检查建议词
    if (this.keyword !== this.$store.state.search.keyword) {
      this.fetchSuggestion();
    }
    this.checkIfId();
    // update store
    this.$store.commit('search/setKeyword', this.keyword);
    // Set scroll to last state
    const scrollTop = parseInt(this.$cookies.get("search-scroll"), 10);
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
      this.$cookies.set('serach-scroll', 0, '1h');
    }
    // Add resize event listener
    this.$nextTick(() => {
      window.addEventListener("resize", this.windowResized, false);
      window.addEventListener("scroll", this.handleScroll, false);
    });
    // check search from
    if (this.from.startsWith('pic/')) {
      this.from = null;
    }
    // change title
    document.title = `搜索 - ${this.keyword} - Pixiviz`;
  },
  beforeDestroy() {
    if (this.illustNotice) {
      this.illustNotice.close();
    }
    if (this.artistNotice) {
      this.artistNotice.close();
    }
  },
  destroyed() {
    // 清除监听器
    this.leaveSuggestion();
    window.removeEventListener("resize", this.windowResized, false);
    window.removeEventListener("scroll", this.handleScroll, false);
  },
  methods: {
    infiniteHandler($state) {
      // 屏蔽了就不发包
      if (this.keywordBlocked || !this.keyword) {
        return;
      }
      this.axios
        .get(`${CONFIG.OWN_API}/illust/search`, {
          params: {
            word: this.keyword,
            page: this.page,
          }
        })
        .then(response => {
          if (!response.data.illusts) {
            // 加载失败
            $state.complete();
            if (response.data.sensitive) {
              this.sensitiveBlocked = true;
            }
            return;
          }
          if (response.data.illusts.length === 0) {
            // 无数据
            $state.complete();
            return;
          }
          let images = response.data.illusts.filter(img => {
            if (img.x_restrict || img.sanity_level > 4) {
              return false;
            }
            if (!window.pixiviz.infoMap[img.id]) window.pixiviz.infoMap[img.id] = img;
            return true;
          });
          this.images = this.images.concat(images);
          // 缓存 images
          this.$store.commit("search/setImages", this.images);
          // 设置 Load 状态为 false
          if (this.$refs.waterfall) {
            this.$refs.waterfall.firstLoad = false;
          }
          // Page + 1
          this.page = this.page + 1;
          this.$store.commit("search/setPage", this.page);
          $state.loaded();
        }, () => {
          $state.complete();
        });
    },
    fetchSuggestion() {
      this.axios.get(`${CONFIG.OWN_API}/search/suggestions`, {
        params: {
          keyword: this.keyword,
        }
      }).then((res) => {
        if (res.data && Array.isArray(res.data)) {
          this.suggestions = res.data.filter(item => item !== this.keyword);
          this.$store.commit('search/setSuggestions', this.suggestions);
        }
      });
    },
    checkIfId() {
      // 检查关键词是不是纯数字
      if (id_matcher.test(this.keyword) && !isNaN(this.keyword)) {
        this.checkIfIllust();
        this.checkIfArtist();
      }
    },
    checkIfIllust() {
      this.axios.get(`${CONFIG.OWN_API}/illust/detail`, {
        params: {
          id: parseInt(this.keyword, 10),
        },
      }).then((res) => {
        if (!res || !res.data || !res.data.illust) {
          return;
        }
        const { data: { illust } } = res;
        // bind event to search notify
        document.body.addEventListener('click', this.illustNoticeClick, false);
        this.illustNotice = this.$notify({
          title: '您要找的可能是：',
          position: 'bottom-left',
          dangerouslyUseHTMLString: true,
          duration: 5000,
          onClose: this.illustNoticeClose,
          message: `
            <div class="search-notify">
              <span data-name="search-notify-illust">画作 ${illust.title} （ID: ${this.keyword}）</span>
            </div>`
        });
      });
    },
    checkIfArtist() {
      this.axios.get(`${CONFIG.OWN_API}/user/detail`, {
        params: {
          id: parseInt(this.keyword, 10),
        },
      }).then((res) => {
        if (!res || !res.data || !res.data.user) {
          return;
        }
        const { data: { user } } = res;
        document.body.addEventListener('click', this.artistNoticeClick, false);
        this.artistNotice = this.$notify({
          title: '您要找的可能是：',
          position: 'bottom-left',
          dangerouslyUseHTMLString: true,
          duration: 5000,
          onClose: this.artistNoticeClose,
          message: `
            <div class="search-notify">
              <span data-name="search-notify-artist">画师 ${user.name} （ID: ${this.keyword}）</span>
            </div>`
        });
      });
    },
    refreshWaterfall() {
      this.page = 1;
      this.images = [];
      this.waterfallIdentifier = this.waterfallIdentifier + 1;
    },
    submitSearch() {
      this.keywordInput = this.keywordInput.trim();
      if (!this.keywordInput || this.keywordInput.length < 1) {
        this.$message.error('呐，输入关键词再搜索！！');
        this.keywordInput = '';
        return;
      }
      // avoid redundant navigation
      if (this.keywordInput === this.keyword) {
        return;
      }
      this.$router.push(`/search/${this.keywordInput}`);
      // 清除监听器
      this.leaveSuggestion();
    },
    checkBlocked() {
      // 检查屏蔽
      let flag_blocked = false;
      this.blockedCountTime = parseInt(window.localStorage.getItem('blocked_count_time'));
      if (new Date().valueOf() - this.blockedCountTime > 180000) {
        this.blockedCount = 1;
        window.localStorage.setItem('blocked_count', 1);
        window.localStorage.setItem('blocked_count_time', new Date().valueOf());
      } else {
        this.blockedCount = parseInt(window.localStorage.getItem('blocked_count'), 10);
        if (!this.blockedCount) {
          window.localStorage.setItem('blocked_count', 1);
          window.localStorage.setItem('blocked_count_time', new Date().valueOf());
        } else {
          window.localStorage.setItem('blocked_count', this.blockedCount + 1);
          window.localStorage.setItem('blocked_count_time', new Date().valueOf());
        }
      }
      for (let pattern of BLOCK_WORDS) {
        if (pattern.test(this.keyword)) {
          flag_blocked = true;
        }
      }
      this.keywordBlocked = flag_blocked;
    },
    handleKeywordChanged(keyword) {
      if (keyword === this.keyword) {
        return;
      }
      this.keyword = keyword;
      this.keywordInput = keyword;
      // 检查屏蔽
      this.checkBlocked();
      // update store
      this.$store.commit('search/setKeyword', this.keyword);
      this.$store.commit('search/setImages', []);
      this.$store.commit('search/setPage', 1);
      // refresh
      this.refreshWaterfall();
      this.resetScrollState();
      this.fetchSuggestion();
      this.checkIfId();
      // change title
      document.title = `${this.keyword} - Pixiviz`;
    },
    handleCardClicked(imageId) {
      this.$cookies.set(
        "pic-from",
        `search/${this.$route.params.keyword}`,
        "1h"
      );
      // 设置图片缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      this.$router.push(`/pic/${imageId}`);
    },
    handleSuggestionClick(word) {
      this.$router.push(`/search/${word}`);
      // 清除监听器
      this.leaveSuggestion();
    },
    handleBack() {
      if (this.from) {
        this.$router.push(`/${this.from}`);
      } else {
        this.$router.push('/');
      }
    },
    scrollSuggesion(e) {
      e.preventDefault();
      e.stopPropagation();
      this.suggestionTranslate = this.suggestionTranslate + e.deltaY * 2.5;
      if (this.suggestionTranslate < 0) {
        this.suggestionTranslate = 0;
      }
      if (this.suggestionTranslate > this.$refs.suggestionItems.scrollWidth - this.$refs.suggestionItems.clientWidth) {
        this.suggestionTranslate = this.$refs.suggestionItems.scrollWidth - this.$refs.suggestionItems.clientWidth;
      }
      this.$refs.suggestionItems.setAttribute('style', `transform: translateX(-${this.suggestionTranslate}px)`);
    },
    enterSuggesion() {
      if (!this.$refs.suggestions) {
        return;
      }
      if (
        this.$refs.suggestions.scrollWidth >
        this.$refs.suggestions.clientWidth
      ) {
        window.addEventListener("mousewheel", this.scrollSuggesion, {
          passive: false
        });
      }
    },
    leaveSuggestion() {
      window.removeEventListener("mousewheel", this.scrollSuggesion, {
        passive: false
      });
    },
    // 窗口事件
    handleScroll() {
      this.$cookies.set("search-scroll", document.documentElement.scrollTop, "1h");
    },
    resetScrollState() {
      this.scrollTop = 0;
      this.$cookies.set("search-scroll", 0, "1h");
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    getCardWidth(width) {
      return MobileResponsive.getCardWidth(width);
    },
    // 通知事件
    illustNoticeClick(e) {
      if (e.target.dataset.name && e.target.dataset.name === 'search-notify-illust') {
        // this.keyword此处等同于pic id
        this.$router.push(`/pic/${this.keyword}`);
        this.illustNotice.close();
        if (this.artistNotice) {
          this.artistNotice.close();
          this.artistNotice = null;
        }
      }
    },
    illustNoticeClose() {
      document.body.removeEventListener('click', this.illustNoticeClick, false);
    },
    artistNoticeClick(e) {
      if (e.target.dataset.name && e.target.dataset.name === 'search-notify-artist') {
        this.$router.push(`/artist/${this.keyword}`);
        this.artistNotice.close();
        if (this.illustNotice) {
          this.illustNotice.close();
          this.illustNotice = null;
        }
      }
    },
    artistNoticeClose() {
      document.body.removeEventListener('click', this.artistNoticeClick, false);
    },
  }
};
</script>
