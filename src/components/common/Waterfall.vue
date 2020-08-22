<template>
    <div class="waterfall-container" v-masonry :fit-width="fitWidth" item-selector=".waterfall-item" transition-duration="0s">
        <ImageCard class="waterfall-item" v-masonry-tile
            v-for="(item, index) in images" :key="index" :image="item"
            :cardWidth="cardWidth" :imageType="imageType" :squaredImage="squaredImage"
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
        },
        squaredImage: {
            type: Boolean,
            default: false
        },
        randomKey: {
            type: Boolean,
            default: false,
        },
        fitWidth: {
            type: Boolean,
            default: false,
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