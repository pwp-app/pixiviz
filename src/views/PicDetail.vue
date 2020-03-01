<template>
    <div class="pic-container" v-loading="infoLoading">
        <div class="pic">
            <div class="pic-presentation">
                <Presentation :image="image" :block="block"/>
            </div>
            <div class="pic-side">
                <Author :author="image.artistPreView"></Author>
                <Related :images="relatedImages"></Related>
            </div>
        </div>
        <Overlay text="图片无法展示" v-if="block"/>
        <Overlay text="图片信息加载失败" v-if="loadFailed"/>
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
            imageId: this.$route.params.id,
            image: {},
            infoLoading: true,
            loadFailed: false,
            block: false,
            relatedImages: [],
            relatedLoadFailed: false
        }
    },
    components: {
        Presentation,
        Author,
        Overlay,
        Related
    },
    mounted() {
        this.fetchInfo();
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
            this.axios.get(`https://api.pixivic.com/illusts/${this.image.id}/related`, {
                params: {
                    page: 1,
                    pageSize: 6
                }
            }).then(response => {
                if (!response.data.data) {
                    this.relatedLoadFailed = true;
                }
                this.relatedImages = response.data.data;
            });
        }
    }
}
</script>