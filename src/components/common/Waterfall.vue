<template>
    <div class="waterfall-container" v-masonry transition-duration="200ms" item-selector=".waterfall-item" v-loading="firstLoad">
        <ImageCard v-masonry-tile class="waterfall-item" v-for="item in images" :key="item.id" :image="item"/>
        
    </div>
</template>

<script>
import ImageCard from './ImageCard';

export default {
    name: 'Common.Waterfall',
    props: {
        pageSize: {
            default: 5,
            type: Number
        },
        images: {
            type: Array
        }
    },
    components: {
        ImageCard
    },
    data() {
        return {
            firstLoad: true,   // 初次加载显示 Loading
            page: 1
        }
    },
    mounted() {
        this.loadData();
    },
    methods: {
        loadData() {
            this.$emit('load', {
                page: this.page,
                pageSize: this.pageSize
            });
        },
        setFirstLoad(status) {
            if (typeof status === 'boolean') {
                this.firstLoad = status
            }
        }
    }
}
</script>