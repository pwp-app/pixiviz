<template>
    <div class="pic-presentation-image-wrapper" :style="{width: imageWidth + 'px'}">
        <div v-loading="imageLoading" class="pic-presentation-image"
            :style="{width: imageWidth + 'px', height: imageHeight + 'px'}">
            <img ref="image" v-lazy="source"
                :style="{width: imageWidth + 'px', height: imageHeight + 'px'}"
                @click="openLightBox"
                >
            <div style="clear: both;"></div>
            <div class="pic-presentation-image-error" v-if="imageLoadError">
                <div class="pic-presentation-image-error-icon">
                    <i class="el-icon-warning-outline"/>
                </div>
                <div class="pic-presentation-image-error-tip">
                    <span>图片加载失败</span>
                </div>
            </div>
        </div>
        <Paginator :page="page" :pageCount="image ? image.page_count : 0" @page-turn="handlePageChanged"/>
        <div class="pic-presentation-info" v-if="image">
            <div class="pic-presentation-info-title">
                <span>{{image ? image.title : ''}}</span>
            </div>
            <div class="pic-presentation-info-caption">
                <span v-html="image ? image.caption : ''"></span>
            </div>
            <div class="pic-presentation-info-tags">
                <div class="pic-tag" v-for="tag in tags" :key="tag.id">
                    <span :data-tag="tag.name" @click="handleTagClicked">#{{tag.name}}</span>
                </div>
            </div>
            <div class="pic-presentation-info-stat">
                <div class="pic-stat">
                    <i class="el-icon-view"></i><span>{{views}}</span>
                </div>
                <div class="pic-stat">
                    <i class="el-icon-star-on"></i><span>{{bookmarks}}</span>
                </div>
            </div>
            <div class="pic-presentation-info-time">
                <span>{{createTime}}</span>
            </div>
        </div>
        <transition>
            <LightBox
                v-if="lightBoxShow"
                :src="source"
                :isLanding="imageWidth < imageHeight"
                :isOverHeight="imageHeight / (imageWidth / screenWidth) > screenHeight"
                @close="onLightBoxClose"
                />
        </transition>
    </div>
</template>

<script>
import CONFIG from '@/config.json';
import dayjs from 'dayjs';
/* Components */
import Paginator from './Pagniator';
import LightBox  from './LightBox';

export default {
    name: 'Pic.Presentation',
    props: ['image', 'block'],
    components: {
        Paginator,
        LightBox,
    },
    data() {
        return {
            sizeCache: {},
            limitWidth: 1152,
            limitHeight: 796,
            screenWidth: document.documentElement.clientWidth,
            screenHeight: document.documentElement.clientHeight,
            imageEl: null,
            imageSize: {},
            imageWidth: 0,
            imageHeight: 0,
            imageLoading: true,
            imageLoadError: false,
            page: 1,
            // lightbox
            lightBoxShow: false,
        }
    },
    beforeCreate() {
        if (window.isSafari) {
            if (!window.downloadQueue) window.downloadQueue = [];
            if (!window.downloadCounter) window.downloadCounter = 0;
        }
    },
    mounted() {
        // image
        this.imageEl = this.$refs.image;
        // lazyload
        this.$Lazyload.$on('loaded', ({el, src}) => {
            if (src === this.source) {
                this.imageLoading = false;
                if (!this.sizeCache[this.page]) {
                    this.sizeCache[this.page] = {};
                    this.sizeCache[this.page] = {
                        x: el.naturalWidth,
                        y: el.naturalHeight
                    }
                }
                this.imageWidth = this.computeWidth(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
                this.imageHeight = this.computeHeight(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
            }
        });
        this.$Lazyload.$on('error', ({el, src}) => {
            if (src === this.source) {
                this.imageLoading = false;
                this.imageLoadError = true;
            }
        });
        // 绑定 Resize
        window.addEventListener('resize', this.windowResized, false);
        // 设定初始大小限制
        this.setLimitWidth(this.screenWidth);
    },
    destroyed() {
        window.removeEventListener('resize', this.windowResized, false);
    },
    watch: {
        image: {
            immediate: true,
            handler(image) {
                this.imageLoading = true;
                this.imageLoadError = false;
                this.page = 1;
                this.sizeCache = {};
                this.imageSize.x = image ? image.width : 0;
                this.imageSize.y = image ? image.height : 0;
                this.setLimitWidth(document.documentElement.clientWidth);
                this.imageWidth = this.computeWidth(image ? image.width : 0, image ? image.height : 0);
                this.imageHeight = this.computeHeight(image ? image.width : 0, image ? image.height : 0);
            }
        },
        screenWidth(width) {
            this.setLimitWidth(width);
            this.updateDisplaySize();
        }
    },
    computed: {
        source() {
            if (this.image && this.image.meta_single_page) {
                if (this.block) {
                    return '';
                } else {
                    if (this.image && this.image.page_count < 2) {
                        return this.image.meta_single_page.original_image_url.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
                    } else if (this.image && this.image.page_count >= 2) {
                        return this.image.meta_pages[this.page - 1].image_urls.original.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
                    } else {
                        return '';
                    }
                }
            } else {
                return '';
            }
        },
        tags() {
            if (this.image) {
                return this.image.tags;
            } else {
                return [];
            }
        },
        views() {
            if (this.image) {
                return this.image.total_view;
            } else {
                return 0;
            }
        },
        bookmarks() {
            if (this.image) {
                return this.image.total_bookmarks;
            } else {
                return 0;
            }
        },
        createTime() {
            if (this.image) {
                return dayjs(this.image.create_date).format('YYYY 年 MM 月 DD 日');
            } else {
                return null;
            }
        },
    },
    methods: {
        setLimitWidth(width) {
            if (width >= 2560) {
                this.limitWidth = 1680;
                this.limitHeight = 960;
            } else if (width > 1680 && width <= 1920) {
                this.limitWidth = 1152;
                this.limitHeight = 796;
            } else if (width > 1430 && width <= 1680) {
                this.limitWidth = 920;
                this.limitHeight = 640;
            } else if (width > 1366 && width <= 1430) {
                this.limitWidth = 802;
                this.limitHeight = 580;
            } else if (width > 1024 && width <= 1366) {
                this.limitWidth = 740;
                this.limitHeight = 540;
            } else if (width <= 1024) {
                this.limitWidth = 600;
                this.limitHeight = 480;
            }
        },
        windowResized() {
            this.screenWidth = document.documentElement.clientWidth;
            this.screenHeight = document.documentElement.clientHeight;
        },
        updateDisplaySize() {
            if (this.sizeCache[this.page]) {
                this.imageWidth = this.computeWidth(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
                this.imageHeight = this.computeHeight(this.sizeCache[this.page].x, this.sizeCache[this.page].y);
            } else {
                this.imageWidth = this.computeWidth(this.imageSize.x, this.imageSize.y);
                this.imageHeight = this.computeHeight(this.imageSize.x, this.imageSize.y);
            }
        },
        computeWidth(o_width, o_height) {
            let height = o_height / (o_width / this.limitWidth);
            if (height > this.limitHeight) {
                return o_width / (o_height / this.limitHeight);
            } else {
                return this.limitWidth;
            }
        },
        computeHeight(o_width, o_height) {
            let height = o_height / (o_width / this.limitWidth);
            if (height > this.limitHeight) {
                return this.limitHeight;
            } else {
                return height;
            }
        },
        handlePageChanged(toward) {
            this.page = this.page + toward * 1;
            this.imageLoading = true;
            this.imageLoadError = false;
        },
        handleTagClicked(e) {
            this.$cookies.set('search-from', `pic/${this.image.id}`);
            this.$router.push(`/search/${e.currentTarget.dataset.tag}`);
        },
        // lightbox
        openLightBox() {
            if (this.imageLoading || this.imageLoadError) {
                return;
            }
            this.lightBoxShow = true;
            this.$emit('lightbox-open');
        },
        onLightBoxClose() {
            this.lightBoxShow = false;
            this.$emit('lightbox-close');
        }
    }
}
</script>
