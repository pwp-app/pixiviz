<template>
  <div class="pic-author">
    <div class="pic-author-title">
      <span>画师</span>
    </div>
    <div class="pic-author-info">
      <div class="pic-author-info-avatar" v-lazy:background-image="avatar"></div>
      <a
        :class="{
          'pic-author-name--long': isLongName,
        }"
        :href="this.author ? `/artist/${this.author.id}` : 'javascript:;'"
        @click.prevent="toArtistPage"
      >
        {{ authorName }}
      </a>
    </div>
  </div>
</template>

<script>
import { getMaxWeightedHost } from '@/util/host';

export default {
  name: 'Pic.Author',
  props: ['author', 'imageId'],
  computed: {
    avatar() {
      if (this.author) {
        return this.author.profile_image_urls.medium.replace('i.pximg.net', this.getProxyHost());
      } else {
        return '';
      }
    },
    authorName() {
      if (this.author) {
        return this.author.name;
      } else {
        return '';
      }
    },
    isLongName() {
      return this.authorName && this.authorName.length > 12;
    },
  },
  methods: {
    getProxyHost() {
      const hosts = this.$config.image_proxy_host;
      if (typeof hosts !== 'object') {
        return hosts;
      }
      const maxWeightedHost = getMaxWeightedHost(hosts);
      return maxWeightedHost;
    },
    toArtistPage() {
      this.$emit('navigate', this.author.id);
    },
  },
};
</script>
