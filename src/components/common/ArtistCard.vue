<template>
  <div class="artist-card">
    <div class="artist-card-header">
      <div class="artist-card-header__info">
        <div class="artist-card-header__avatar">
          <div class="avatar" :style="{ backgroundImage: `url(${this.avatar})` }" v-lazy></div>
        </div>
        <div class="artist-card-header__name">
          <span>{{ name }}</span>
        </div>
        <div class="artist-card-header__id mobile-hide">
          <span><span class="no-select">ID: </span>{{ artistId }}</span>
        </div>
      </div>
      <div class="artist-card-header__button">
        <el-button type="primary" round @click="handleEntryClicked">进入画师主页</el-button>
      </div>
    </div>
    <div class="artist-card-content" v-if="userIllusts.length">
      <ImageCard
        v-for="image in userIllusts"
        :key="image.id"
        :image="image"
        imageType="square_medium"
        :cardWidth="cardWidth"
        :absolute="false"
        :position="{
          height: cardWidth,
        }"
        @clicked="handleCardClicked"
      />
    </div>
    <div class="artist-card-empty" v-else>
      <span>该画师没有可展示的作品</span>
    </div>
  </div>
</template>

<script>
import proxy from '../../mixin/proxy';
import ImageCard from '../../components/common/ImageCard.vue';
import { filterImages } from '../../util/filter';

const BLANK_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default {
  props: {
    artist: Object,
    cardWidth: {
      type: Number,
      default: 208,
    },
  },
  components: {
    ImageCard,
  },
  mixins: [proxy],
  computed: {
    avatar() {
      if (!this.artist || !this.artist.user) {
        return BLANK_IMAGE;
      }
      return this.artist.user.profile_image_urls.medium.replace(
        'i.pximg.net',
        this.getImageProxyHost(),
      );
    },
    name() {
      return this.artist.user.name;
    },
    artistId() {
      return this.artist.user.id;
    },
    userIllusts() {
      return filterImages(this.artist.illusts, false).map((item, index) => {
        return {
          ...item,
          index,
        };
      });
    },
  },
  methods: {
    handleCardClicked(imageId) {
      this.$emit('card-clicked', imageId);
    },
    handleEntryClicked() {
      this.$emit('entry-clicked', this.artistId);
    },
  },
};
</script>
