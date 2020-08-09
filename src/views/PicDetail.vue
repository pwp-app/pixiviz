<template>
    <div
        :class="['pic-container',
                infoLoading ? 'pic-container-loading' : null,
                block || loadFailed ? 'pic-container-failed' : null,
                lightboxShow ? 'pic-container-lockscroll' : null,
                ]"
        v-loading="infoLoading"
    >
        <div class="pic" v-if="!infoLoading">
            <div class="pic-presentation">
                <Presentation
                    v-if="image"
                    :image="image"
                    :block="block"
                    @lightbox-open="handleLightBoxOpen"
                    @lightbox-close="handleLightBoxClose"
                    />
            </div>
            <div class="pic-side">
                <Author :author="author" :imageId="image ? image.id : null" v-if="author"></Author>
                <div class="pic-download" v-if="image && image.page_count > 1">
                    <div class="pic-download-title">
                        <span>下载</span>
                    </div>
                    <div class="pic-download-items" v-if="image && image.page_count > 1">
                        <el-button type="primary" @click="downloadAll">下载所有</el-button>
                    </div>
                </div>
                <Related
                    ref="related"
                    v-if="relatedImages"
                    :key="showPart"
                    :images="showPart ? imageSlice : relatedImages"
                    :oimages="relatedImages"
                    :page="relatedPage"
                    :offset="pageOffset"
                    :completed="relatedCompleted"
                    @go="handleRelatedPageChanged"
                    @infite-load="handleRelatedInfiniteLoad"
                    @change-page-size="handlePageSizeChanged"
                    :orientation="screenOrientation"
                ></Related>
            </div>
        </div>
        <Overlay text="图片无法展示" v-if="block" />
        <Overlay text="图片信息加载失败" v-if="loadFailed" :showRefresh="true"/>
        <div class="pic-close" @click="handleClose">
            <i class="el-icon-close"></i>
        </div>
        <div :class="['pic-action', actionShowClass ? 'pic-action-show' : null]" v-if="!infoLoading && actionShow">
            <HomeIcon @action="handleAction" />
            <RankIcon @action="handleAction" />
            <LinkIcon @action="handleAction" />
            <BackIcon @action="handleAction" />
        </div>
    </div>
</template>

<script>
import * as clipboard from "clipboard-polyfill/dist/text/clipboard-polyfill.text";

import Presentation from '../components/pic/Presentation';
import Author from '../components/pic/Author';
import Related from '../components/pic/Related';
import Overlay from '../components/pic/Overlay';

// icons
import HomeIcon from '../components/icons/home';
import RankIcon from '../components/icons/rank';
import LinkIcon from '../components/icons/link';
import BackIcon from '../components/icons/back';

// config
import CONFIG from '../config.json';

let lastOffset = 0;

export default {
    name: 'Pic',
    data() {
        return {
            image: null,
            infoLoading: true,
            loadFailed: false,
            block: false,
            relatedImages: [],
            relatedLoading: false,
            relatedCompleted: false,
            relatedPage: 1,
            relatedPageSize: 6,
            realRelatedPage: 1,
            pageOffset: 0,
            from: this.$cookies.get('pic-from'),
            // screen
            screenOrientation: window.orientation,
            showPart: window.orientation !== 0,
            // download
            downloadStarted: false,
            // action
            actionShow: false,
            actionShowClass: false,
            link: window.location.href,
            // lightbox
            lightboxShow: false,
        }
    },
    components: {
        Presentation,
        Author,
        Overlay,
        Related,
        // icons
        HomeIcon,
        RankIcon,
        LinkIcon,
        BackIcon,
    },
    computed: {
        imageId() {
            return this.$route.params.id;
        },
        imageSlice() {
            return this.relatedImages.slice((this.relatedPage - 1) * this.relatedPageSize, this.relatedPage * this.relatedPageSize);
        },
        author() {
            if (this.image && this.image.user) {
                return this.image.user;
            } else {
                return null;
            }
        },
        originalUrls() {
            if (!this.image || this.image.page_count < 2) {
                return null;
            } else {
                return this.image.meta_pages;
            }
        },
    },
    mounted() {
        if (this.image === null) {
            this.fetchInfo();
            document.title = `图片${this.imageId} - Pixiviz`;
        } else {
            this.image.title = `${this.image.title} - Pixiviz`;
        }
        // add event listener
        window.addEventListener('orientationchange', this.handleScreenRotate, false);
        window.addEventListener('scroll', this.handleScroll);
        // reset var
        lastOffset = 0;
        // scroll to top
        window.scrollTo({
            top: 0,
        });
    },
    destroyed() {
        window.removeEventListener('orientationchange', this.handleScreenRotate, false);
        window.removeEventListener('scroll', this.handleScroll);
    },
    watch: {
        '$route.params.id': 'handleIdChanged'
    },
    methods: {
        fetchInfo() {
            // 检查缓存
            if (this.$store.state.imageCache.image) {
                this.image = this.$store.state.imageCache.image;
                this.afterLoad();
                // 用完就丢
                this.$store.commit('imageCache/destory');
                this.infoLoading = false;
                return;
            }
            this.axios.get('/api/v1/illust/detail', {
                params: {
                    id: this.imageId,
                }
            }).then(response => {
                if (!response.data || !response.data.illust) {
                    this.infoLoading = false;
                    this.loadFailed = true;
                    return;
                }
                this.infoLoading = false;
                this.image = response.data.illust;
                this.afterLoad();
            }, () => {
                this.infoLoading = false;
                this.loadFailed = true;
            });
        },
        afterLoad() {
            if (this.image.x_restrict == 1 || this.image.sanity_level > 5) {
                this.block = true;
            }
            // fetch related
            this.fetchRelated();
            // change title
            document.title = this.image.title + ' - Pixiviz';
        },
        fetchRelated(state) {
            this.relatedLoading = true;
            this.axios.get(`${CONFIG.OWN_API}/illust/related`, {
                params: {
                    id: this.imageId,
                    page: this.realRelatedPage,
                }
            }).then(response => {
                if (!response.data.illusts || response.data.illusts.length === 0) {
                    this.relatedLoading = false;
                    this.relatedCompleted = true;
                    if (state) state.complete();
                    return;
                }
                let images = response.data.illusts.filter(img => {
                    if (img.x_restrict || img.sanity_level > 5) {
                        return false;
                    }
                    if (!window.pixiviz.infoMap[img.id]) window.pixiviz.infoMap[img.id] = img;
                    return true;
                });
                this.relatedImages = this.relatedImages.concat(images);
                this.relatedLoading = false;
                if (state) {
                    state.loaded();
                }
            });
        },
        handleIdChanged() {
            this.infoLoading = true;
            this.downloadStarted = false;
            this.fetchInfo();
            // 重置related
            this.relatedPage = 1;
            this.realRelatedPage = 1;
            this.$nextTick(() => {
                if (this.$refs.related) {
                    this.$refs.related.reset();
                }
                this.relatedImages = [];
            });
            // change title
            document.title = `图片${this.imageId} - Pixiviz`;
            // reset var
            lastOffset = 0;
        },
        handlePageSizeChanged(size) {
            this.relatedPageSize = size;
        },
        handleRelatedPageChanged(toward) {
            if (toward < 0) {
                this.relatedPage = this.relatedPage - 1;
            } else {
                if (!this.relatedLoading) {
                    this.relatedPage = this.relatedPage + 1;
                    // 提前2页load
                    if (this.relatedPage * this.relatedPageSize > this.relatedImages.length - this.relatedPageSize) {
                        this.realRelatedPage = this.realRelatedPage + 1;
                        this.fetchRelated();
                    }
                }
            }
        },
        handleScreenRotate() {
            if (this.screenOrientation === 0 && window.orientation !== 0) {
                // 切割显示的数组
                this.$nextTick(() => {
                    this.$refs.related.reset();
                    this.showPart = true;
                });
            } else if (this.screenOrientation !== 0 && window.orientation === 0) {
                this.$nextTick(() => {
                    this.$refs.related.reset();
                    this.showPart = false;
                });
            }
            this.screenOrientation = window.orientation;
        },
        handleRelatedInfiniteLoad(state) {
            this.realRelatedPage = this.realRelatedPage + 1;
            this.fetchRelated(state);
        },
        handleClose() {
            if (this.from) {
                if (window.localStorage.getItem('is-entry-pic')) {
                    const entryFrom = window.localStorage.getItem('entry-pic-from');
                    if (entryFrom) {
                        this.$router.push('/' + entryFrom);
                        window.localStorage.removeItem('is-entry-pic');
                        window.localStorage.removeItem('entry-pic-from');
                        return;
                    } else {
                        this.$router.push('/');
                    }
                }
                this.$router.push('/' + this.from);
            } else {
                this.$router.push('/');
            }
        },
        downloadImage(src, name, queue = false) {
            if (queue) {
                window.downloadQueue.push({
                    url: src,
                    name: name
                });
                return;
            }
            const image = new Image();
            image.setAttribute('crossOrigin', '*');
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, image.width, image.height);
                const url = canvas.toDataURL('image/jpeg');
                let a = document.createElement('a');
                a.download = name;
                a.href = url;
                a.click();
                a = null;
            };
            image.src = src;
        },
        downloadAll() {
            if (!this.originalUrls) {
                return;
            }
            // notice
            this.notification = this.$notify({
                title: '',
                position: 'top-right',
                customClass: 'oneline-notice-container',
                dangerouslyUseHTMLString: true,
                duration: 2000,
                message: `
                    <div class="oneline-notice">
                        <span data-name="notice-download">${this.downloadStarted ? '您的下载已经开始了，请耐心等待' : '您的下载开始了，请注意浏览器的提示'}</span>
                    </div>`
            });
            // lock
            if (this.downloadStarted) {
                setTimeout(() => {
                    this.downloadStarted = false;
                }, 3000);
                return;
            }
            for (let i = 0; i < this.originalUrls.length; i++) {
                this.downloadImage(this.originalUrls[i].image_urls
                    .original.replace('i.pximg.net', CONFIG.DOWNLOAD_HOST),
                    `${this.image.id}-${i}.jpg`, window.isSafari ? true : false);
            }
            if (window.isSafari) {
                if (!window.downloadTimer) {
                    window.downloadTimer = setInterval(() => {
                        if (window.downloadQueue.length) {
                            const image = window.downloadQueue.shift();
                            this.downloadImage(image.url, image.name);
                            window.downloadCounter = 0;
                        } else {
                            window.downloadCounter++;
                            // 闲置超过10秒即销毁
                            if (window.downloadCounter > 10) {
                                clearInterval(window.downloadTimer);
                            }
                        }
                    }, 1000);
                }
            }
            this.downloadStarted = true;
            this.contextMenuVisible = false;
        },
        handleLightBoxOpen() {
            this.lightboxShow = true;
        },
        handleLightBoxClose() {
            this.lightboxShow = false;
        },
        // action
        handleScroll() {
            if (window.pageYOffset - lastOffset < -50) {
                if (this.actionShow) {
                    this.actionShowClass = false;
                    setTimeout(function() {
                        this.actionShow = false;
                    }.bind(this), 300);
                }
                lastOffset = window.pageYOffset;
            } else if (window.pageYOffset - lastOffset > 50) {
                if (!this.actionShow) {
                    this.actionShow = true;
                    setTimeout(function() {
                        this.actionShowClass = this.actionShow;
                    }.bind(this), 0);
                    }
                lastOffset = window.pageYOffset;
            }
        },
        handleAction(action) {
            switch (action) {
                case 'home':
                    this.$router.push('/');
                    break;
                case 'rank':
                    this.$router.push('/rank');
                    break;
                case 'copy-link':
                    clipboard.writeText(window.location.href);
                    this.$notify({
                        title: '',
                        position: 'top-right',
                        customClass: 'oneline-notice-container',
                        dangerouslyUseHTMLString: true,
                        duration: 2000,
                        message: `
                            <div class="oneline-notice">
                                <span data-name="oneline-notice">当前页面的链接已经复制到剪贴板啦~</span>
                            </div>`
                    });
                    break;
                case 'back':
                    this.handleClose();
                    break;
            }
        }
    }
}
</script>
