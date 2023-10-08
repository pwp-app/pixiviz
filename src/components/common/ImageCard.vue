<template>
  <div class="image-card-wrapper" :style="positionStyle">
    <a
      :href="loadError || block || !image ? 'javascript:;' : `/pic/${image.id}`"
      :class="{
        'image-card': true,
        'image-card-status-error': loadError || block,
        'image-card--more': moreMenuVisible,
      }"
      :style="{ width: cardWidth + 'px', height: loadHeight + 'px' }"
      @click.prevent="handleClick"
    >
      <div class="image-card-overlay image-card-block" v-if="block">
        <div class="image-card-overlay-icon" v-if="loadHeight >= 128">
          <i class="el-icon-warning-outline" />
        </div>
        <div
          :class="['image-card-overlay-tip', loadHeight < 128 ? 'image-card-overlay-tip-xs' : null]"
        >
          <span>该图片无法展示</span>
        </div>
      </div>
      <div class="image-card-overlay image-card-error" v-if="loadError">
        <div class="image-card-overlay-icon" v-if="loadHeight >= 128">
          <i class="el-icon-warning-outline" />
        </div>
        <div
          :class="['image-card-overlay-tip', loadHeight < 128 ? 'image-card-overlay-tip-xs' : null]"
        >
          <span>图片加载失败</span>
        </div>
      </div>
      <div class="image-card-count" v-if="image && image.page_count > 1">
        <span>{{ image ? image.page_count : '' }}</span>
      </div>
      <el-dropdown
        v-if="isCollection"
        trigger="hover"
        placement="bottom"
        @click.native.stop
        @command="handleMoreCommand"
        @visible-change="handleMenuVisibleChanged"
      >
        <div class="image-card-more">
          <IconMore class="image-card-more__icon" />
        </div>
        <el-dropdown-menu class="image-card-dropdown" slot="dropdown">
          <el-dropdown-item command="remove">
            取消收藏
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <div
        ref="image"
        class="image-card-image"
        :data-index="image ? image.index : ''"
        data-type="card"
        v-if="!block"
        v-loading="loading"
        v-lazy:background-image="source"
      ></div>
      <div class="image-card-title">
        {{ image.title }}
      </div>
    </a>
  </div>
</template>

<script>
import IconMore from '../icons/more';

export default {
  name: 'Common.ImageCard',
  props: {
    image: {
      type: Object,
      default: () => ({}),
    },
    imageType: {
      type: String,
      default: 'medium',
    },
    cardWidth: {
      type: Number,
      default: 100,
    },
    position: {
      type: Object,
      default: () => null,
    },
    absolute: {
      type: Boolean,
      default: true,
    },
    isCollection: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    IconMore,
  },
  watch: {
    image: {
      immediate: true,
      handler() {
        this.loading = true;
        this.loadError = false;
        this.removeEvents();
        this.registerEvents();
      },
    },
  },
  data() {
    return {
      loading: false,
      loadError: false,
      block: this.image.x_strict ? true : this.image.sanity_level > 5,
      moreMenuVisible: false,
    };
  },
  created() {
    this.registerEvents();
  },
  beforeDestroy() {
    this.removeEvents();
  },
  computed: {
    source() {
      if (this.block || !this.image) {
        return '';
      } else {
        let url = this.image.image_urls[this.imageType].replace('i.pximg.net', this.getHost());
        if (window.isSafari) {
          url = url.replace('_10_webp', '_70');
        }
        return url;
      }
    },
    positionStyle() {
      if (!this.absolute) {
        return null;
      }
      const top = this.position ? this.position.top : 0;
      const left = this.position ? this.position.left : 0;
      return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
      };
    },
    loadHeight() {
      if (!this.position) {
        return 0;
      }
      return this.position.height;
    },
    cardIdentifier() {
      if (!this.image) {
        return '';
      }
      return `${this.image.index}_${this.image.id}`;
    },
  },
  methods: {
    registerEvents() {
      this.$bus.$on(`image-loaded-card-${this.cardIdentifier}`, this.loadedHandler);
      this.$bus.$on(`image-error-card-${this.cardIdentifier}`, this.errorHandler);
    },
    removeEvents() {
      this.$bus.$off(`image-loaded-card-${this.cardIdentifier}`, this.loadedHandler);
      this.$bus.$off(`image-error-card-${this.cardIdentifier}`, this.errorHandler);
    },
    getHost() {
      const hosts = this.$config.image_proxy_host;
      // no load balance, return host directly
      if (typeof hosts !== 'object') {
        return hosts;
      }
      if (!hosts.idxList) {
        const hostArr = Object.keys(hosts);
        if (hostArr && Array.isArray(hostArr) && hostArr.length) {
          return hostArr[0];
        }
      }
      // use hash to judge image server
      const hash = Number(this.image.id) % hosts.idxList.length;
      const hostIdx = hosts.idxList[hash];
      const host = hosts[hostIdx];
      return host;
    },
    handleClick() {
      if (!this.block && !this.loadError) {
        this.$emit('clicked', this.image.id);
      }
    },
    loadedHandler() {
      this.loading = false;
      this.loadError = false;
      this.$forceUpdate();
    },
    errorHandler() {
      this.loading = false;
      this.loadError = true;
      this.$store.commit('loadController/setImageLoadFailed', this.getHost());
      this.$forceUpdate();
    },
    handleMoreCommand(command) {
      // eslint-disable-next-line default-case
      switch (command) {
        case 'remove':
          this.$emit('remove', this.image.id);
          break;
      }
    },
    handleMenuVisibleChanged(visibility) {
      this.moreMenuVisible = visibility;
    },
  },
};
</script>
