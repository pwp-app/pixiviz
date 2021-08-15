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
        <div class="artist-overview-content-other">
          <ArtistInfoTag
            class="artist-other-clickable"
            :content="isMobile ? artistId : `ID ${artistId}`"
            @click.native="copyLink"
          ></ArtistInfoTag>
          <ArtistInfoTag :content="formattedRegion" v-if="region"></ArtistInfoTag>
          <Male v-if="gender && gender === 'male'" />
          <Female v-if="gender && gender === 'female'" />
          <Twitter class="artist-other-clickable" v-if="twitterUrl" @click.native="openTwitter" />
          <Website class="artist-other-clickable" v-if="websiteUrl" @click.native="openWebsite" />
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
import Website from '../icons/website.vue';
import Twitter from '../icons/twitter.vue';
import Male from '../icons/male.vue';
import Female from '../icons/female.vue';
import ArtistInfoTag from './ArtistInfoTag.vue';
import * as clipboard from 'clipboard-polyfill';

const regionTester = /\s?\((.+)\)/;

export default {
  name: 'Artist.ArtistDetail',
  props: {
    artistId: String,
  },
  components: {
    Website,
    Twitter,
    ArtistInfoTag,
    Male,
    Female,
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
      websiteUrl: '',
      twitterUrl: '',
      gender: '',
      region: '',
      isMobile: document.documentElement.clientWidth <= 767,
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
    formattedRegion() {
      if (!this.region) {
        return '';
      }
      const match = regionTester.exec(this.region);
      if (match) {
        return match[1];
      }
      return this.region;
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
      this.websiteUrl = profile.webpage;
      this.twitterUrl = profile.twitter_url;
      this.gender = profile.gender;
      this.region = profile.region;
      // profile img
      if (profile.is_using_custom_profile_image && profile.background_image_url) {
        this.$emit(
          'setbg',
          profile.background_image_url.replace(
            'i.pximg.net',
            typeof this.$config.image_proxy_host === 'string'
              ? this.$config.image_proxy_host
              : this.$config.image_proxy_host[0],
          ),
        );
      }
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
    copyLink() {
      clipboard.writeText(window.location.href);
      this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `<div class="oneline-notice"><span data-name="oneline-notice">画师链接已复制到剪贴板~</span></div>`,
      });
    },
    openTwitter() {
      if (window.isSafari) {
        window.location.href = this.twitterUrl;
      } else {
        window.open(this.twitterUrl, '_blank');
      }
    },
    openWebsite() {
      if (window.isSafari) {
        window.location.href = this.websiteUrl;
      } else {
        window.open(this.websiteUrl, '_blank');
      }
    },
  },
};
</script>
