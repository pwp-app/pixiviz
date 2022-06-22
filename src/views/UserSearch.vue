<template>
  <div class="search-container usearch-container">
    <div class="usearch-responsive search-header">
      <div class="search-header-title">
        <span>搜索</span>
      </div>
      <div class="search-header-input">
        <el-input
          placeholder="输入画师名称或 ID"
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
    <div class="usearch-responsive usearch-content">
      <ArtistCard
        v-for="artist in artists"
        :key="artist.user.id"
        :artist="artist"
        :cardWidth="imageCardWidth"
        @card-clicked="handleCardClicked"
        @entry-clicked="handleEntryClicked"
      />
    </div>
    <div class="infinite-failed" v-if="loadFailed">
      <p>看上去数据加载失败了</p>
      <el-button type="primary" round @click="fetchNew">点我重试</el-button>
    </div>
    <infinite-loading
      :identifier="infiniteId"
      @infinite="loadArtistsData"
      spinner="spiral"
      v-if="!loadFailed"
    >
      <span slot="no-results">这里没有数据...</span>
      <span slot="no-more">没有更多结果了...</span>
    </infinite-loading>
    <BackToTop ref="backToTop" />
  </div>
</template>

<script>
import ArtistCard from '../components/common/ArtistCard.vue';
import BackToTop from '../components/common/BackToTop.vue';
import { setOgTags, getOgTags } from '../util/og';

const id_matcher = /^\d{2,8}$/;

export default {
  components: {
    ArtistCard,
    BackToTop,
  },
  data() {
    return {
      artists: this.initData(),
      artistIdMap: {},
      infiniteId: 0,
      loadFailed: false,
      cachedState: false,
      page: this.$store.state.userSearch.page !== null ? this.$store.state.userSearch.page : 1,
      keyword: this.$route.params.keyword,
      keywordInput: this.$route.params.keyword,
      imageCardWidth: this.getImageCardWidth(document.documentElement.clientWidth),
      screenWidth: document.documentElement.clientWidth,
      scrollTop: 0,
      artistNotice: null,
    };
  },
  watch: {
    '$route.params.keyword': 'handleKeywordChanged',
    screenWidth(width) {
      this.imageCardWidth = this.getImageCardWidth(width);
    },
  },
  mounted() {
    this.$store.commit('userSearch/setKeyword', this.keyword);
    this.$nextTick(() => {
      window.addEventListener('resize', this.windowResized, false);
      window.addEventListener('scroll', this.handleScroll, false);
    });
    this.checkIfId();
    // check scroll state
    const scrollTop = parseInt(this.$cookies.get('usearch-scroll'), 10);
    if (this.artists.length > 0) {
      if (scrollTop) {
        this.$nextTick(() => {
          window.scrollTo(0, scrollTop);
          if (scrollTop > 300) {
            this.$refs.backToTop && this.$refs.backToTop.display();
          }
        });
      }
    } else {
      this.$cookies.set('usearch-scroll', 0, '1h');
    }
    // og tags
    this.setOgTagData();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.windowResized, false);
    window.removeEventListener('scroll', this.handleScroll, false);
    if (this.artistNotice) {
      this.artistNotice.close();
    }
  },
  methods: {
    initData() {
      if (this.$store.state.userSearch.keyword === this.$route.params.keyword) {
        return this.$store.state.userSearch.artists || [];
      }
      return [];
    },
    fetchNew() {
      this.loadFailed = false;
      if (!this.artists) {
        this.$nextTick(() => {
          this.infiniteId += 1;
          this.resetScrollState();
        });
      } else {
        this.$nextTick(() => {
          this.cachedState?.reset();
        });
      }
    },
    checkIfId() {
      // 检查关键词是不是纯数字
      if (id_matcher.test(this.keyword) && !isNaN(this.keyword)) {
        this.checkIfArtist();
      }
    },
    resetScrollState() {
      this.scrollTop = 0;
      this.$cookies.set('usearch-scroll', 0, '1h');
    },
    loadArtistsData($state) {
      if (!this.keyword) {
        $state.complete();
        return;
      }
      this.cachedState = $state;
      this.axios
        .get(`${this.$config.api_prefix}/user/search`, {
          params: {
            keyword: this.keyword,
            page: this.page,
          },
        })
        .then(
          (response) => {
            if (response.status === 500) {
              $state.complete();
              this.loadFailed = true;
              return;
            }
            const { data } = response;
            if (!data.user_previews) {
              $state.complete();
              return;
            }
            const { user_previews: artistsData } = data;
            if (Array.isArray(artistsData) && artistsData.length === 0) {
              $state.complete();
              return;
            }
            const filteredData = artistsData.filter((artist) => {
              if (!this.artistIdMap[artist.user.id]) {
                this.artistIdMap[artist.user.id] = true;
                return true;
              } else {
                return false;
              }
            });
            if (filteredData.length < 1) {
              $state.complete();
              return;
            }
            this.artists = this.artists.concat(filteredData);
            this.$store.commit('userSearch/setArtists', this.artists);
            // 设置加载状态
            this.page += 1;
            this.$store.commit('userSearch/setPage', this.page);
            $state.loaded();
          },
          (err) => {
            // eslint-disable-next-line no-console
            console.error('Fetch artists search data error', err);
            $state.complete();
            this.loadFailed = true;
            this.cachedState = null;
          },
        );
    },
    handleKeywordChanged(keyword) {
      if (keyword === this.keyword) {
        return;
      }
      // refresh page
      this.keyword = keyword;
      this.keywordInput = keyword;
      this.$store.commit('userSearch/setKeyword', this.keyword);
      this.$store.commit('userSearch/setArtists', []);
      this.$store.commit('userSearch/setPage', 1);
      this.artists = [];
      this.infiniteId += 1;
      this.resetScrollState();
      this.loadFailed = false;
      this.checkIfId();
      // change title
      document.title = `${this.keyword} - Pixiviz`;
      // set og tags
      this.setOgTagData();
    },
    submitSearch() {
      if (
        !this.keywordInput ||
        this.keywordInput.length < 1 ||
        (this.keywordInput && this.keywordInput.trim().length < 1)
      ) {
        this.$message.error('呐，输入画师名称或ID再搜索！！');
        this.keywordInput = '';
        return;
      }
      this.keywordInput = this.keywordInput.trim();
      // avoid redundant navigation
      if (this.keywordInput === this.keyword) {
        return;
      }
      this.$router.push(`/usearch/${encodeURIComponent(this.keywordInput)}`);
    },
    windowResized() {
      this.screenWidth = document.documentElement.clientWidth;
    },
    handleScroll() {
      this.$cookies.set('usearch-scroll', document.documentElement.scrollTop, '1h');
    },
    getImageCardWidth(screenWidth) {
      if (screenWidth >= 1024) {
        return 282;
      } else if (screenWidth >= 768 && screenWidth < 1024) {
        return 182;
      } else if (screenWidth < 768) {
        return 164;
      }
    },
    handleBack() {
      if (this.from) {
        this.$router.push(`/${this.from}`);
      } else {
        this.$router.push('/');
      }
    },
    handleCardClicked(imageId) {
      this.$cookies.set('pic-from', `usearch/${encodeURIComponent(this.keyword)}`, '1h');
      // 设置图片缓存
      const info = window.pixiviz.infoMap[imageId];
      if (info) {
        this.$store.commit('imageCache/setCache', info);
      }
      this.$router.push(`/pic/${imageId}`);
    },
    handleEntryClicked(artistId) {
      const storedRoutes = window.localStorage.getItem('pic-routes');
      const routes = storedRoutes ? JSON.parse(storedRoutes) || [] : [];
      if (routes.length < 1) {
        routes.push({
          type: 'entry',
          from: this.from,
        });
      }
      routes.push({
        type: 'usearch',
        keyword: this.keyword,
      });
      routes.mtime = Date.now();
      window.localStorage.setItem('pic-routes', JSON.stringify(routes));
      this.$router.push(`/artist/${artistId}`);
    },
    setOgTagData() {
      setOgTags(getOgTags(), {
        ogTitle: `${this.keyword} - 搜索`,
        ogDesc: `二次元画师搜索，跨次元链接，就在 Pixiviz`,
        ogUrl: window.location.href,
        // eslint-disable-next-line no-undef
        ogImage: `${this.$config.website_url}/favicon.png`,
      });
    },
    checkIfArtist() {
      this.axios
        .get(`${this.$config.api_prefix}/user/detail`, {
          params: {
            id: parseInt(this.keyword, 10),
          },
        })
        .then((res) => {
          if (!res || !res.data || !res.data.user) {
            return;
          }
          const {
            data: { user },
          } = res;
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
            </div>`,
          });
        });
    },
    artistNoticeClick(e) {
      if (e.target.dataset.name && e.target.dataset.name === 'search-notify-artist') {
        this.$router.push(`/artist/${encodeURIComponent(this.keyword)}`);
        this.artistNotice.close();
      }
    },
    artistNoticeClose() {
      document.body.removeEventListener('click', this.artistNoticeClick, false);
    },
  },
};
</script>
