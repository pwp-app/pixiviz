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
        @card-clicked="handleCardClicked"
        @entry-clicked="handleEntryClicked"
      />
    </div>
    <div class="search-failed" v-if="fetchFailed">
      <p>看上去数据加载失败了</p>
      <el-button type="primary" round @click="fetchNew">点我重试</el-button>
    </div>
    <infinite-loading
      :identifier="infiniteId"
      @infinite="loadArtistsData"
      spinner="spiral"
      v-if="!fetchFailed"
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
      fetchFailed: false,
      page: this.$store.state.userSearch.page !== null ? this.$store.state.userSearch.page : 1,
      keyword: this.$route.params.keyword,
      keywordInput: this.$route.params.keyword,
    };
  },
  watch: {
    '$route.params.keyword': 'handleKeywordChanged',
  },
  mounted() {
    this.$store.commit('userSearch/setKeyword', this.keyword);
  },
  methods: {
    initData() {
      if (this.$store.state.userSearch.keyword === this.$route.params.keyword) {
        return this.$store.state.userSearch.artists || [];
      }
      return [];
    },
    loadArtistsData($state) {
      if (!this.keyword) {
        $state.complete();
        return;
      }
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
              this.fetchFailed = true;
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
            console.error('Fetch search data error', err);
            $state.complete();
          },
        );
    },
    submitSearch() {},
    handleBack() {
      if (this.from) {
        this.$router.push(`/${this.from}`);
      } else {
        this.$router.push('/');
      }
    },
    handleCardClicked() {},
    handleEntryClicked() {},
  },
};
</script>
