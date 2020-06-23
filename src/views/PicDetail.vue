<template>
    <div class="pic-container" v-loading="infoLoading">
        <div class="pic">
            <div class="pic-presentation">
                <Presentation :image="image" :block="block"/>
            </div>
            <div class="pic-side">
                <Author :author="author"></Author>
                <Related
                    ref="related"
                    :key="showPart"
                    :images="showPart ? imageSlice : relatedImages"
                    :page="relatedPage"
                    :offset="pageOffset"
                    @go="handleRelatedPageChanged"
                    @infite-load="handleRelatedInfiniteLoad"
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
            return this.relatedImages.slice((this.relatedPage - 1 + this.pageOffset) * 6, (this.relatedPage + this.pageOffset) * 6);
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
            });
        },
        fetchRelated(state) {
            this.relatedLoading = true;
            this.axios.get(`https://api.pixivic.com/illusts/${this.image.id}/related`, {
                params: {
                    page: this.relatedPage,
                    pageSize: 6
                }
            }).then(response => {
                if (!response.data.data) {
                    this.relatedLoadFailed = true;
                    this.relatedLoading = false;
                    return;
                }
                this.relatedImages = this.relatedImages.concat(response.data.data);
                this.relatedLoading = false;
                if (state) {
                    state.loaded();
                }
            });
        },
        handleIdChanged() {
            this.infoLoading = true;
            this.fetchInfo();
            // 清空relatedImages
            this.$nextTick(() => {
                this.$refs.related.reset();
                this.relatedImages = [];
            })
        },
        handleRelatedPageChanged(toward) {
            if (toward < 0) {
                this.pageOffset = this.pageOffset - 1;
            } else {
                if (!this.relatedLoading) {
                    this.relatedPage = this.relatedPage + 1;
                    this.fetchRelated();
                    if (this.pageOffset < 0) {
                        this.pageOffset = this.pageOffset + 1;
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
                })
            } else if (this.screenOrientation !== 0 && window.orientation === 0) {
                this.$nextTick(() => {
                    this.$refs.related.reset();
                    this.showPart = false;
                })
            }
            this.screenOrientation = window.orientation;
        },
        handleRelatedInfiniteLoad(state) {
            this.relatedPage = this.relatedPage + 1;
            this.fetchRelated(state);
        },
        handleClose(){
            this.$router.push('/' + this.from);
        }
    }
}
</script>