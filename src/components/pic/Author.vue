<template>
    <div class="pic-author">
        <div class="pic-author-title">
            <span>画师</span>
        </div>
        <div class="pic-author-info">
            <div class="pic-author-info-avatar" v-lazy:background-image="avatar"></div>
            <span>{{authorName}}</span>
        </div>
    </div>
</template>

<script>
import CONFIG from '@/config.json';

export default {
    name: 'Pic.Author',
    props: ['author'],
    computed: {
        avatar() {
            if (this.author) {
                return this.author.profile_image_urls.medium.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
            } else {
                return '';
            }
        },
        authorName() {
            if (this.author){
                return this.author.name;
            } else {
                return '';
            }
        }
    }
}
</script>