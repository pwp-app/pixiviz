<template>
    <div class="search-container">
        <div class="search-header">
            <div class="search-header-title">
                <span>搜索</span>
            </div>
            <div class="search-header-input">
                <el-input
                    placeholder="输入搜索关键词"
                    v-model="keywordInput"
                    spellcheck="false"
                    @keyup.enter.native="submitSearch"
                >
                    <i slot="prefix" class="el-input__icon el-icon-search"></i>
                </el-input>
            </div>
            <div class="search-header-close">
                <i class="el-icon-close" @click="handleBack"></i>
            </div>
        </div>
        <div
            class="search-suggestion"
            ref="suggestions"
            @mouseenter="enterSuggesion"
            @mouseleave="leaveSuggestion"
            v-if="suggestions.length > 0"
        >
            <div
                class="search-suggestion-item"
                v-for="suggestion in suggestions"
                :key="suggestion.keyword"
                @click="handleSuggestionClick(suggestion.keyword)"
            >
                <span>{{ suggestion.keyword }}</span>
            </div>
        </div>
        <div class="search-content">
            <div
                class="waterfall-wrapper"
                :key="waterfallResponsive"
                v-if="waterfallResponsive"
            >
                <Waterfall
                    class="waterfall waterfall-responsive"
                    ref="waterfall"
                    :images="images"
                    @card-clicked="handleCardClicked"
                    :cardWidth="cardWidth"
                    imageType="medium"
                />
            </div>
            <div class="waterfall-wrapper" v-if="!waterfallResponsive">
                <Waterfall
                    class="waterfall"
                    ref="waterfall"
                    :images="images"
                    @card-clicked="handleCardClicked"
                    :cardWidth="cardWidth"
                    imageType="medium"
                    fit-width="true"
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
// Util
import MobileResponsive from "../util/MobileResponsive";

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
            keyword: this.$route.params.keyword,
            keywordInput: this.$route.params.keyword,
            waterfallIdentifier: Math.round(Math.random() * 100),
            from: this.$cookies.get("search-from"),
            suggestionScrollLock: false,
            // Misc
            screenWidth: document.documentElement.clientWidth,
            cardWidth: this.getCardWidth(document.documentElement.clientWidth),
            waterfallResponsive: true,
            scrollTop: 0,
        };
    },
    watch: {
        "$route.params.keyword": "handleKeywordChanged",
        /* Watch screen width */
        screenWidth(width) {
            this.screenWidth = width;
            this.scrollTop = document.documentElement.scrollTop;
            if (this.screenWidth <= 767) {
                this.waterfallResponsive = false;
            } else {
                this.waterfallResponsive = true;
            }
            this.$nextTick(() => {
                this.cardWidth = this.getCardWidth(this.screenWidth);
                document.documentElement.scrollTop = this.scrollTop;
            });
        }
    },
    mounted() {
        this.fetchSuggestion();
        // Set scroll to last state
        let scrollTop = this.$cookies.get("search-scroll");
        if (scrollTop) {
            window.scrollTo(0, scrollTop);
        }
        // Add resize event listener
        this.$nextTick(() => {
            window.addEventListener("resize", this.windowResized, false);
        });
        // Add scroll event listener
        window.addEventListener("scroll", this.handleScroll, false);
    },
    destroyed() {
        // 清除监听器
        this.leaveSuggestion();
        window.removeEventListener("resize", this.windowResized, false);
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
            this.$refs.waterfall.$el.innerHTML = "";
            this.$nextTick(() => {
                // 重置瀑布流参数
                this.page = 1;
                this.images = [];
                this.waterfallIdentifier = this.waterfallIdentifier + 1;
            });
        },
        submitSearch() {
            this.keywordInput = this.keywordInput.trim();
            if (!this.keywordInput || this.keywordInput.length < 1) {
                this.$message.error('呐，输入关键词再搜索！！');
                this.keywordInput = '';
                return;
            }
            this.$router.push(`/search/${this.keywordInput}`);
            // 清除监听器
            this.leaveSuggestion();
        },
        handleKeywordChanged(keyword) {
            this.keyword = keyword;
            this.keywordInput = keyword;
            this.refreshWaterfall();
            this.resetScrollState();
        },
        handleCardClicked(imageId) {
            this.$cookies.set(
                "pic-from",
                `search/${this.$route.params.keyword}`,
                "20min"
            );
            this.$router.push(`/pic/${imageId}`);
        },
        handleSuggestionClick(word) {
            this.$router.push(`/search/${word}`);
            // 清除监听器
            this.leaveSuggestion();
        },
        handleBack() {
            if (this.from) {
                this.$router.push("/" + this.from);
            } else {
                this.$router.push({
                    name: "Landing"
                });
            }
        },
        scrollSuggesion(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!this.suggestionScrollLock) {
                this.suggestionScrollLock = true;
                this.$refs.suggestions.scrollTo({
                    left: this.$refs.suggestions.scrollLeft + e.deltaY * 4,
                    behavior: "smooth"
                });
                setTimeout(() => {
                    this.suggestionScrollLock = false;
                }, 125);
            }
        },
        enterSuggesion() {
            if (
                this.$refs.suggestions.scrollWidth >
                this.$refs.suggestions.clientWidth
            ) {
                window.addEventListener("mousewheel", this.scrollSuggesion, {
                    passive: false
                });
            }
        },
        leaveSuggestion() {
            window.removeEventListener("mousewheel", this.scrollSuggesion, {
                passive: false
            });
        },
        // 窗口事件
        handleScroll() {
            this.$cookies.set("search-scroll", document.documentElement.scrollTop, "20min");
        },
        resetScrollState() {
            this.scrollTop = 0;
            this.$cookies.set("search-scroll", 0, "20min");
        },
        windowResized() {
            this.screenWidth = document.documentElement.clientWidth;
        },
        getCardWidth(width) {
            return MobileResponsive.getCardWidth(width);
        }
    }
};
</script>