<template>
    <div class="search-container">
        <div class="search-header">
            <div class="search-header-title">
                <span>搜索</span>
            </div>
            <div class="search-header-input">
                <el-input placeholder="输入搜索关键词" v-model="keyworkInput" spellcheck="false">
                    <i slot="prefix" class="el-input__icon el-icon-search"></i>
                </el-input>
            </div>
            <div class="search-header-close" v-if="from">
                <i class="el-icon-close" @click="handleBack"></i>
             </div>
        </div>
        <div class="search-suggestion" v-if="suggestions.length > 0">
            <div
                class="search-suggestion-item"
                v-for="suggestion in suggestions"
                :key="suggestion.keyword"
            >
                <span>{{suggestion.keyword}}</span>
            </div>
        </div>
        <div class="search-content">
            <div class="waterfall-wrapper">
                <Waterfall
                    ref="waterfall"
                    :images="images"
                    @card-clicked="handleCardClicked"
                    :cardWidth="280"
                    imageType="medium"
                />
            </div>
        </div>
        <infinite-loading
            :identifier="waterfallIdentifier"
            @infinite="infiniteHandler"
            spinner="spiral"
        ></infinite-loading>
        <BackToTop />
    </div>
</template>

<script>
// Common components
import Waterfall from "../components/common/Waterfall";
import BackToTop from "../components/common/BackToTop";

export default {
    name: "Search",
    components: {
        Waterfall,
        BackToTop
    },
    data() {
        return {
            page: 1,
            pageSize: 30,
            images: [],
            suggestions: [],
            keyword: this.$route.query.keyword,
            keyworkInput: this.$route.query.keyword,
            waterfallIdentifier: Math.round(Math.random() * 100),
            from: this.$cookies.get('search-from')
        };
    },
    watch: {
        "$route.query.keyword": "handleKeywordChanged"
    },
    mounted() {
        this.fetchSuggestion();
    },
    methods: {
        infiniteHandler($state) {
            this.axios
                .get("https://api.pixivic.com/illustrations", {
                    params: {
                        illustType: "illust",
                        searchType: "origin",
                        maxSanityLevel: 5,
                        keyword: this.keyword,
                        page: this.page,
                        pageSize: this.pageSize
                    }
                })
                .then(response => {
                    if (!response.data.data) {
                        // 加载失败
                        $state.complete();
                        return;
                    }
                    this.images = this.images.concat(response.data.data);
                    // 设置 Load 状态为 false
                    this.$refs.waterfall.firstLoad = false;
                    // Page + 1
                    this.page = this.page + 1;
                    $state.loaded();
                });
        },
        fetchSuggestion() {
            this.axios
                .get(
                    `https://api.pixivic.com/keywords/${this.keyword}/pixivSuggestions`
                )
                .then(response => {
                    if (response.data.data) {
                        this.suggestions = response.data.data;
                    }
                });
        },
        refreshWaterfall() {
            // 提前清空 dom
            this.$refs.waterfall.$el.innerHTML = '';
            this.$nextTick(() => {
                // 重置瀑布流参数
                this.page = 1;
                this.images = [];
                this.waterfallIdentifier = this.waterfallIdentifier + 1;
            });
        },
        handleKeywordChanged(keyword) {
            this.keyword = keyword
            this.refreshWaterfall();
        },
        handleCardClicked(imageId) {
            this.$cookies.set('pic-from', `search?keyword=${this.$route.query.keyword}`, '20min');
            this.$router.push(`/pic/${imageId}`);
        },
        handleBack() {
            
        }
    }
};
</script>