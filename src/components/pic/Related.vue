<template>
    <div class="pic-related">
        <div class="pic-related-title">
            <span>相关作品</span>
            <div class="pic-related-paginator" v-if="orientation !== 0 && oimages.length >= 6">
                <div class="pic-related-paginator-item" v-if="hasPrev" @click="handleGo(-1)">
                    <i class="el-icon-arrow-left"></i>
                </div>
                <div class="pic-related-paginator-item" @click="handleGo(1)">
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
        </div>
        <div class="pic-related-content" v-if="!completed">
            <div class="waterfall-wrapper">
                <Waterfall ref="waterfall"
                    :images="images" @card-clicked="handleCardClicked"
                    :cardWidth="cardWidth" imageType="square_medium" :squaredImage="true"/>
            </div>
        </div>
        <div class="pic-related-content-completed" v-else>
            <span>没有相关图片...</span>
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
    props: ['images', 'oimages', 'page', 'orientation', 'completed'],
    components: {
        Waterfall
    },
    data() {
        return {
            screenWidth: window.innerWidth,
            // Waterfall
            waterfallIdentifier: Math.round(Math.random() * 100)
        }
    },
    computed: {
        hasPrev() {
            return this.page > 1;
        },
        cardWidth() {
            const width = this.screenWidth;
            if (width > 1366) {
                this.$emit('change-page-size', 6);
                return 204;
            } else if (width > 1024 && width <= 1366) {
                if (this.orientation === 0) {
                    this.$emit('change-page-size', 20);
                    return Math.floor((width - 48) / 4) - 16;
                } else {
                    this.$emit('change-page-size', 6);
                    return 181;
                }
            } else if (width > 768 && width <= 1024) {
                this.$emit('change-page-size', 30);
                return Math.floor((width - 48) / 4) - 16;
            } else if (width > 567 && width <= 768) {
                this.$emit('change-page-size', 30);
                return Math.floor((width - 48) / 3) - 16;
            } else if (width <= 567) {
                this.$emit('change-page-size', 30);
                return Math.floor((width - 48) / 2) - 16;
            }
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
        }
    },
    destroyed(){
        window.removeEventListener("resize", this.windowResized, false);
    },
    methods: {
        reset() {
            this.$refs.waterfall.$el.innerHTML = '';
        },
        // Window & Screen
        windowResized() {
            this.screenWidth = window.innerWidth;
            // 只有6个元素，重绘确保正确性
            if (this.screenWidth >= 1366) {
                this.$nextTick(() => {
                    this.$redrawVueMasonry();
                });
            }
        },
        // Event
        handleCardClicked(imageId) {
            // 设置缓存
            const info = window.pixiviz.infoMap[imageId];
            if (info) {
                this.$store.commit('imageCache/setCache', info);
            }
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