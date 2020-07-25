<template>
    <div :class="['pic-container', infoLoading ? 'pic-container-loading' : null]" v-loading="infoLoading">
        <div class="pic" v-if="!infoLoading">
            <div class="pic-presentation">
                <Presentation :image="image" v-if="image" :block="block"/>
            </div>
            <div class="pic-side">
                <Author :author="author" v-if="author"></Author>
                <Related
                    ref="related"
                    v-if="relatedImages"
                    :key="showPart"
                    :images="showPart ? imageSlice : relatedImages"
                    :oimages="relatedImages"
                    :page="relatedPage"
                    :offset="pageOffset"
                    @go="handleRelatedPageChanged"
                    @infite-load="handleRelatedInfiniteLoad"
                    @change-page-size="handlePageSizeChanged"
                    :orientation="screenOrientation"
                    >
                </Related>
            </div>
        </div>
        <Overlay text="图片无法展示" v-if="block"/>
        <Overlay text="图片信息加载失败" v-if="loadFailed"/>
        <div class="pic-close" v-if="from" @click="handleClose">
            <i class="el-icon-close"></i>
        </div>
    </div>
</template>

<script>
import Presentation from '../components/pic/Presentation';
import Author from '../components/pic/Author';
import Related from '../components/pic/Related';
import Overlay from '../components/pic/Overlay';

// config
import CONFIG from '../config.json';

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
            relatedLoadFailed: false,
            relatedPage: 1,
            relatedPageSize: 6,
            realRelatedPage: 1,
            pageOffset: 0,
            from: this.$cookies.get('pic-from'),
            // screen
            screenOrientation: window.orientation,
            showPart: window.orientation !== 0,
        }
    },
    components: {
        Presentation,
        Author,
        Overlay,
        Related
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
        }
    },
    mounted() {
        if (this.image === null) {
            this.fetchInfo();
        }
        // add event listener
        this.$nextTick(() => {
            window.addEventListener('orientationchange', this.handleScreenRotate, false);
        });
        // change title
        document.title = `图片${this.imageId} - Pixiviz`;
    },
    destroyed() {
        window.removeEventListener('orientationchange', this.handleScreenRotate, false);
    },
    watch: {
        '$route.params.id': 'handleIdChanged'
    },
    methods: {
        fetchInfo() {
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
                if (this.image.x_restrict == 1 || this.image.sanity_level > 5) {
                    this.block = true;
                }
                // fetch related
                this.fetchRelated();
                // change title
                document.title = this.image.title + ' - Pixiviz';
            }, () => {
                this.infoLoading = false;
                this.loadFailed = true;
            });
        },
        fetchRelated(state) {
            this.relatedLoading = true;
            this.axios.get(`${CONFIG.OWN_API}/illust/related`, {
                params: {
                    id: this.imageId,
                    page: this.realRelatedPage,
                }
            }).then(response => {
                if (!response.data.illusts) {
                    this.relatedLoadFailed = true;
                    this.relatedLoading = false;
                    return;
                }
                this.relatedImages = this.relatedImages.concat(response.data.illusts);
                this.relatedLoading = false;
                if (state) {
                    state.loaded();
                }
            });
        },
        handleIdChanged() {
            this.infoLoading = true;
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
        handleScreenRotate(){
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
        handleClose(){
            this.$router.push('/' + this.from);
        }
    }
}
</script>