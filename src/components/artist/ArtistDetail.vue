<template>
  <div class="artist-detail" v-if="loaded">
    <div class="artist-overview">
      <div class="artist-overview-avatar">
        <div id="avatar" v-lazy-container :style="{ backgroundImage: `url(${this.avatar})` }"></div>
      </div>
      <div class="artist-overview-content">
        <div class="artist-overview-content-name">
          <span>{{ name }}</span>
        </div>
        <div class="artist-overview-content-data">
          <div class="overview-data">
            <div class="overview-data-name">
              <span>插画</span>
            </div>
            <div class="overview-data-number">
              <span>{{ totalIllusts }}</span>
            </div>
          </div>
          <div class="overview-data">
            <div class="overview-data-name">
              <span>漫画</span>
            </div>
            <div class="overview-data-number">
              <span>{{ totalManga }}</span>
            </div>
          </div>
          <div class="overview-data">
            <div class="overview-data-name">
              <span>小说</span>
            </div>
            <div class="overview-data-number">
              <span>{{ totalNovel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="artist-comment" v-if="comment">
      <pre>{{ comment }}</pre>
    </div>
    <div class="artist-comment-empty" v-else></div>
  </div>
</template>

<script>
import proxy from '../../mixin/proxy';

export default {
  name: 'Artist.ArtistDetail',
  props: {
    artistId: String,
  },
  mixins: [proxy],
  data() {
    return {
      artist: null,
      name: '',
      comment: '',
      totalIllusts: 0,
      totalManga: 0,
      totalNovel: 0,
      loaded: false,
    };
  },
  mounted() {
    this.fetchDetail();
  },
  computed: {
    avatar() {
      if (this.artist) {
        return this.artist.user.profile_image_urls.medium.replace(
          'i.pximg.net',
          this.getImageProxyHost(),
        );
      } else {
        return '';
      }
    },
  },
  methods: {
    fetchDetail() {
      const stored = this.$store.state.artist.map[this.artistId];
      if (stored) {
        this.artist = stored;
        this.afterLoad();
        return;
      }
      if (!this.artistId) {
        return;
      }
      this.axios
        .get(`${this.$config.api_prefix}/user/detail`, {
          params: {
            id: this.artistId,
          },
        })
        .then((res) => {
          if (res.status !== 200 || !res.data) {
            this.$emit('failed');
            return;
          }
          this.artist = res.data;
          this.$store.commit('artist/setMapItem', { id: this.artistId, content: this.artist });
          this.afterLoad();
        });
    },
    afterLoad() {
      // 拆解
      const { profile } = this.artist;
      if (!profile) {
        this.$emit('failed');
        return;
      }
      this.totalIllusts = profile.total_illusts;
      this.totalManga = profile.total_manga;
      this.totalNovel = profile.total_novels;
      const { user } = this.artist;
      this.name = user.name;
      this.comment = user.comment;
      this.loaded = true;
      // 触发事件
      this.$emit('loaded', this.name);
    },
    getComment() {
      return this.comment;
    },
  },
};
</script>
