<template>
    <div class="image-card" :style="{height: this.loadHeight + 'px'}">
        <div class="image-card-image"  v-lazy:background-image="source"></div>
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
            source: this.image.xrestrict ? '' : this.image.imageUrls[0].medium.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST),
            loadHeight: this.image.height / (this.image.width / 280),
            formattedTitle: this.image.title.length > 12 ? this.image.title.substring(0, 13) + '...' : this.image.title
        }
    },
}
</script>

