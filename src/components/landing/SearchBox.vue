<template>
    <div class="searchbox-wrapper" v-lazy:background-image="searchBG">
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
            searchBG: require('@/assets/images/searchbox.jpg'),
            search: ''
        }
    }
}
</script>