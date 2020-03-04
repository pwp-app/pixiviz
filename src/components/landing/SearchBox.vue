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
                <button @click="handleSearchClick"><i class="el-icon-search"></i></button>
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
    watch: {
        "$store.state.landingBanner.expanded": function(expanded) {
            if (expanded) {
                this.bannerExpanded = expanded;
                setTimeout(() => {
                    this.show = false;
                }, 500);
            } else {
                this.show = true;
                setTimeout(() => {
                    this.bannerExpanded = expanded;
                }, 150);
            }
        }
    },
    methods: {
        handleSearchClick() {
            this.$router.push(`/search?keyword=${this.search}`);
        }
    }
}
</script>