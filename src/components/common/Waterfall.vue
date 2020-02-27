<template>
    <div class="waterfall-container" v-masonry transition-duration="200ms" item-selector=".waterfall-item">
        <ImageCard v-masonry-tile class="waterfall-item" v-for="item in images" :key="item.id" :image="item"/>
    </div>
</template>

<script>
import ImageCard from './ImageCard';

export default {
    name: 'Common.Waterfall',
    props: {
        images: {
            type: Array
        }
    },
    components: {
        ImageCard
    }
}
</script>