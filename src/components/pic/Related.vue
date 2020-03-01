<template>
    <div class="pic-related">
        <div class="pic-related-title">
            <span>相关作品</span>
            <div class="pic-related-paginator">
                <div class="pic-related-paginator-item" v-if="page > 1" @click="handleGo(-1)">
                    <i class="el-icon-arrow-left"></i>
                </div>
                <div class="pic-related-paginator-item" @click="handleGo(1)">
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
        </div>
        <div class="pic-related-content">
            <div class="waterfall-wrapper">
                <Waterfall ref="waterfall"
                    :images="images" @card-clicked="handleCardClicked"
                    :cardWidth="cardWidth" imageType="squareMedium" :squaredImage="true"/>
            </div>
        </div>
    </div>
</template>

<script>
import Waterfall from '../../components/common/Waterfall';

export default {
    name: 'Pic.Related',
    props: ['images', 'page'],
    components: {
        Waterfall
    },
    data() {
        return {
            screenWidth: document.documentElement.clientWidth,
            cardWidth: this.getCardWidth(document.documentElement.clientWidth)
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
                return 148;
            } else if (width <= 768) {
                return (width - 48) / 2 - 12;
            }
        },
        windowResized() {
            this.screenWidth = document.documentElement.clientWidth;
        },
        handleCardClicked(imageId) {
            this.$router.push('/pic/'+imageId);
        },
        handleGo(toward) {
            this.$emit('go', toward);
        }
    }
}
</script>