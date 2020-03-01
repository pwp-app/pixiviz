<template>
    <div class="waterfall-container" v-masonry transition-duration="200ms" item-selector=".waterfall-item">
        <ImageCard v-masonry-tile class="waterfall-item"
            v-for="item in images" :key="item.id" :image="item"
            :cardWidth="cardWidth" :imageType="imageType"
            @clicked="handleCardClicked"/>
    </div>
</template>

<script>
import ImageCard from './ImageCard';

export default {
    name: 'Common.Waterfall',
    props: {
        images: {
            type: Array
        },
        cardWidth: {
            type: Number
        },
        imageType: {
            type: String
        }
    },
    components: {
        ImageCard
    },
    methods: {
        handleCardClicked(imageId) {
            this.$emit('card-clicked', imageId);
        }
    }
}
</script>