<template>
    <div :class="['image-card', loadError || block ? 'image-card-status-error' : '']" @click="handleClick" :style="{width: cardWidth + 'px', height: loadHeight + 'px'}">
        <div class="image-card-overlay image-card-block" v-if="block">
            <div class="image-card-overlay-icon">
                <i class="el-icon-warning-outline"/>
            </div>
            <div class="image-card-overlay-tip">
                <span>该图片无法展示</span>
            </div>
        </div>
        <div class="image-card-overlay image-card-error" v-if="loadError">
            <div class="image-card-overlay-icon">
                <i class="el-icon-warning-outline"/>
            </div>
            <div class="image-card-overlay-tip">
                <span>图片加载失败</span>
            </div>
        </div>
        <div class="image-card-count" v-if="image.pageCount > 1">
            <img :src="countIcon"><span>{{image.pageCount}}</span>
        </div>
        <div ref="image" class="image-card-image" v-if="!block" v-loading="loading" v-lazy:background-image="source"></div>
        <div class="image-card-title">
            {{image.title}}
        </div>
    </div>
</template>

<script>
import CONFIG from '@/config.json'

export default {
    name: 'Common.ImageCard',
    props: {
        image: {
            type: Object
        },
        cardWidth: {
            type: Number,
            default: 280
        },
        imageType: {
            type: String
        },
        squaredImage: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            loading: true,
            loadError: false,
            block: this.image.xrestrict ? true : this.image.sanityLevel > 5 ? true : false,
            countIcon: require('@/assets/images/count.svg')
        }
    },
    computed: {
        loadHeight() {
            if (this.squaredImage) {
                return this.cardWidth
            } else {
                return this.image.height / (this.image.width / this.cardWidth);
            }
        },
        source() {
            if (this.block || !this.image) {
                return '';
            } else {
                let url = this.image.imageUrls[0][this.imageType].replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
                if (window.isSafari) {
                    url = url.replace("10_webp", "70");
                }
                return url;
            }
        }
    },
    created() {
        this.$Lazyload.$on('loaded', ({el, src}) => {
            if (src === this.source) {
                this.loading = false;
            }
        });
        this.$Lazyload.$on('error', ({el, src}) => {
            if (src === this.source) {
                this.loading = false;
                this.loadError = true;
            }
        });
    },
    methods: {
        handleClick() {
            if (!this.block && !this.loadError) {
                this.$emit('clicked', this.image.id);
            }
        }
    }
}
</script>

