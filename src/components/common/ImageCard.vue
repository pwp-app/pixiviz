<template>
    <div class="image-card">
        <img :src="source">
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
            source: this.image.xrestrict ? '' : this.image.imageUrls[0].medium.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST)
        }
    }
}
</script>

