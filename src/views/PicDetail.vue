<template>
    <div class="pic-container" v-loading="infoLoading">
        <div class="pic">
            <div class="pic-presentation">
                <Presentation :image="image" :block="block"/>
            </div>
            <div class="pic-side">
                <Author :author="image.artistPreView"></Author>
                <Related :images="relatedImages" :page="relatedPage" @go="handleRelatedPageChanged"></Related>
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
            image: {},
            infoLoading: true,
            loadFailed: false,
            block: false,
            relatedImages: [],
            relatedLoading: false,
            relatedLoadFailed: false,
            relatedPage: 1,
            from: this.$cookies.get('pic-from')
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
        }
    },
    mounted() {
        this.fetchInfo();
    },
    watch: {
        '$route.params.id': 'handleIdChanged'
    },
    methods: {
        fetchInfo() {
            this.axios.get(`https://api.pixivic.com/illusts/${this.imageId}`).then(response => {
                if (!response.data.data) {
                    this.infoLoading = false;
                    this.loadFailed = true;
                    return;
                }
                this.infoLoading = false;
                this.image = response.data.data;
                if (this.image.xrestrict == 1 || this.image.sanityLevel > 5) {
                    this.block = true;
                }
                // fetch related
                this.fetchRelated()
            });
        },
        fetchRelated() {
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
                this.relatedImages = response.data.data;
                this.relatedLoading = false;
            });
        },
        handleIdChanged() {
            this.infoLoading = true;
            this.fetchInfo();
        },
        handleRelatedPageChanged(toward) {
            if (!this.relatedLoading) {
                this.relatedPage = this.relatedPage + toward * 1;
                this.fetchRelated();
            }
        },
        handleClose(){
            this.$router.push('/' + this.from);
        }
    }
}
</script>