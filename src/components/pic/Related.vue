<template>
    <div class="pic-related">
        <div class="pic-related-title">
            <span>相关作品</span>
            <div class="pic-related-paginator" v-if="orientation !== 0 && o-images.length >= 6">
                <div class="pic-related-paginator-item" v-if="hasPrev" @click="handleGo(-1)">
                    <i class="el-icon-arrow-left"></i>
                </div>
                <div class="pic-related-paginator-item" @click="handleGo(1)">
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
        </div>
        <div class="pic-related-content" v-loading="loading">
            <div class="waterfall-wrapper">
                <Waterfall ref="waterfall"
                    :images="images" @card-clicked="handleCardClicked"
                    :cardWidth="cardWidth" imageType="squareMedium" :squaredImage="true"/>
            </div>
        </div>
        <infinite-loading
            v-if="orientation === 0 && images.length > 0"
            :identifier="waterfallIdentifier"
            @infinite="infiniteHandler"
            spinner="spiral"
        ></infinite-loading>
    </div>
</template>

<script>
import Waterfall from '../../components/common/Waterfall';

export default {
    name: 'Pic.Related',
    props: ['images', 'o-images', 'page', 'offset', 'orientation', 'end', 'loading'],
    components: {
        Waterfall
    },
    data() {
        return {
            screenWidth: document.documentElement.clientWidth,
            cardWidth: this.getCardWidth(document.documentElement.clientWidth),
            // Waterfall
            waterfallIdentifier: Math.round(Math.random() * 100)
        }
    },
    computed: {
        hasPrev() {
            return this.page + this.offset > 1;
        }
    },
    mounted() {
        this.$nextTick(() => {
            window.addEventListener("resize", this.windowResized, false);
        });
    },
    watch: {
        screenWidth(width) {
            this.screenWidth = width;
            this.$nextTick(() => {
                this.cardWidth = this.getCardWidth(this.screenWidth);
            });
        }
    },
    destroyed(){
        window.removeEventListener("resize", this.windowResized, false);
    },
    methods: {
        getCardWidth(width) {
            if (width > 1024) {
                return 204;
            }
            if (width > 768 && width <= 1024) {
                if (this.orientation === 0) {
                    return Math.floor((width - 48) / 4) - 14;
                } else {
                    return 148;
                }
            } else if (width > 567 && width <= 768) {
                return Math.floor((width - 48) / 3) - 14;
            } else if (width <= 567) {
                return Math.floor((width - 48) / 2) - 12;
            }
        },
        reset() {
            this.$refs.waterfall.$el.innerHTML = '';
        },
        // Window & Screen
        windowResized() {
            this.screenWidth = document.documentElement.clientWidth;
        },
        // Event
        handleCardClicked(imageId) {
            this.$router.push('/pic/'+imageId);
        },
        handleGo(toward) {
            this.$emit('go', toward);
        },
        infiniteHandler($state) {
            this.$emit('infite-load', $state);
        }
    }
}
</script>