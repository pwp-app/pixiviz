<template>
    <div class="image-card" :style="{height: this.loadHeight + 'px'}">
        <div class="image-card-overlay image-card-block" v-if="block">
            <div class="image-card-block-icon">
                <i class="el-icon-warning-outline"/>
            </div>
            <div class="image-card-block-tip">
                <span>该图片无法展示</span>
            </div>
        </div>
        <div class="image-card-overlay image-card-error" v-if="loadError">
            <div class="image-card-block-icon">
                <i class="el-icon-warning-outline"/>
            </div>
            <div class="image-card-block-tip">
                <span>图片加载失败</span>
            </div>
        </div>
        <div class="image-card-count" v-if="image.pageCount > 1">
            <img v-lazy="countIcon"><span>{{image.pageCount}}</span>
        </div>
        <div class="image-card-image" v-if="!block" v-loading="loading" v-lazy:background-image="source"></div>
        <div class="image-card-title">
            <span>{{formattedTitle}}</span>
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
        }
    },
    data() {
        return {
            loadHeight: this.image.height / (this.image.width / 280),
            formattedTitle: this.image.title.length > 12 ? this.image.title.substring(0, 13) + '...' : this.image.title,
            loading: true,
            loadError: false,
            block: this.image.xrestrict ? true : false,
            source: this.image.xrestrict ? '' : this.image.imageUrls[0].medium.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST),
            countIcon: require('@/assets/images/count.svg')
        }
    },
    mounted() {
        this.$Lazyload.$once('loaded', () => {
            this.loading = false;
        });
        this.$Lazyload.$once('error', () => {
            this.loadError = true;
        });
    }
}
</script>

