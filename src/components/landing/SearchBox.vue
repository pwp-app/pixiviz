<template>
    <div :class="['searchbox-wrapper', bannerExpanded ? 'searchbox-hide' : '']" v-show="show" v-lazy:background-image="searchBG">
        <div class="searchbox">
            <div class="searchbox-title">
                <span>寻找你想要的图片</span>
            </div>
            <div class="searchbox-input">
                <el-input v-model="search" spellcheck="false"></el-input>
            </div>
            <div class="searchbox-button">
                <button><i class="el-icon-search"></i></button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "Landing.SearchBox",
    data() {
        return {
            show: true,
            searchBG: require('@/assets/images/searchbox.jpg'),
            search: '',
            bannerExpanded: false
        }
    },
    mounted() {
        this.$bus.on('banner-changed', this.bannerChanged);
    },
    methods: {
        bannerChanged(status) {
            if (status) {
                this.bannerExpanded = status;
                setTimeout(() => {
                    this.show = false;
                }, 500);
            } else {
                this.show = true;
                setTimeout(() => {
                    this.bannerExpanded = status;
                }, 150);
            }
        }
    }
}
</script>