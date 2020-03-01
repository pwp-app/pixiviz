<template>
    <div class="pic-presentation-image-wrapper" :style="{width: (sizeCache[this.page] ? sizeCache[page].x : imageWidth)+ 'px'}">
        <div v-loading="imageLoading" class="pic-presentation-image"
            :style="{width: (sizeCache[this.page] ? sizeCache[page].x : imageWidth) + 'px', height: (sizeCache[this.page] ? sizeCache[page].y : imageHeight) + 'px'}">
            <img v-lazy="source"
                :style="{width: (sizeCache[page] ? sizeCache[page].x : imageWidth) + 'px',
                height: (sizeCache[page] ? sizeCache[page].y : imageHeight) + 'px !important'}">
            <div class="pic-presentation-image-error" v-if="imageLoadError">
                <div class="pic-presentation-image-error-icon">
                    <i class="el-icon-warning-outline"/>
                </div>
                <div class="pic-presentation-image-error-tip">
                    <span>图片加载失败</span>
                </div>
            </div>
        </div>
        <Paginator :page="page" :pageCount="image.pageCount" @page-turn="handlePageChanged"/>
        <div class="pic-presentation-info">
            <div class="pic-presentation-info-title">
                <span>{{image.title}}</span>
            </div>
            <div class="pic-presentation-info-caption">
                <span v-html="image.caption"></span>
            </div>
        </div>
    </div>
</template>

<script>
import CONFIG from '@/config.json';
/* Components */
import Paginator from './Pagniator';

export default {
    name: 'Pic.Presentation',
    props: ['image', 'block'],
    components: {
        Paginator
    },
    data() {
        return {
            sizeCache: {},
            screenWidth: 0,
            screenHeight: 0,
            imageWidth: 0,
            imageHeight: 0,
            imageLoading: true,
            imageLoadError: false,
            page: 1
        }
    },
    mounted() {
        this.$Lazyload.$on('loaded', ({el, src}) => {
            if (src === this.source) {
                this.imageLoading = false;
                if (!this.sizeCache[this.page]) {
                    this.sizeCache[this.page] = {};
                    this.sizeCache[this.page]['x'] = this.computeWidth(el.naturalWidth, el.naturalHeight);
                    this.sizeCache[this.page]['y'] = this.computeHeight(el.naturalWidth, el.naturalHeight);
                }
            }
        });
        this.$Lazyload.$on('error', ({el, src}) => {
            if (src === this.source) {
                this.imageLoading = false;
                this.imageLoadError = true;
            }
        });
    },
    watch: {
        image: {
            immediate: true,
            handler(image) {
                this.imageLoading = true;
                this.imageLoadError = false;
                this.imageWidth = this.computeWidth(image.width, image.height);
                this.imageHeight = this.computeHeight(image.width, image.height);
            }
        }
    },
    computed: {
        source() {
            if (this.image.imageUrls) {
                if (this.block) {
                    return '';
                } else {
                    return this.image.imageUrls[this.page - 1].original.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
                }
            } else {
                return '';
            }
        }
    },
    methods: {
        computeWidth(o_width, o_height) {
            let height = o_height / (o_width / 1280);
            if (height > 796) {
                return o_width / (o_height / 796);
            } else {
                return 1280;
            }
        },
        computeHeight(o_width, o_height) {
            let height = o_height / (o_width / 1280);
            if (height > 796) {
                return 796;
            } else {
                return height;
            }
        },
        handlePageChanged(toward) {
            this.page = this.page + toward * 1;
            this.imageLoading = true;
            this.imageLoadError = false;
        }
    }
}
</script>