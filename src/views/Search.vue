<template>
    <div :class="['search-container', iPadStyle ? 'ipad-only' : null]" :style="keywordBlocked ? { filter: `blur(${blockedCount / 3}px`} : null">
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
        <div class="search-content" v-if="!keywordBlocked">
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
        <div class="search-content search-content-blocked" v-if="keywordBlocked">
            <p>别搜了，这里真的没有色图...</p>
        </div>
        <infinite-loading
            :identifier="waterfallIdentifier"
            @infinite="infiniteHandler"
            spinner="spiral"
            v-if="!keywordBlocked"
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
// config
import CONFIG from '../config.json';

const id_matcher = /^\d{2,8}$/;

// block words
const BLOCK_WORDS = [/r-?18/i, /18-?r/i, /^色图$/];

export default {
    name: "Search",
    components: {
        Waterfall,
        BackToTop
    },
    data() {
        return {
            page: this.$store.state.search.page !== null ? this.$store.state.search.page : 1,
            images: this.$store.state.search.keyword === this.$route.params.keyword ?
                this.$store.state.search.images ? this.$store.state.search.images: [] : [],
            suggestions: this.$store.state.search.suggestions ? this.$store.state.search.suggestions : [],
            keyword: this.$route.params.keyword,
            keywordInput: this.$route.params.keyword,
            keywordBlocked: false,
            blockedCount: 0,
            waterfallIdentifier: Math.round(Math.random() * 100),
            from: this.$cookies.get("search-from"),
            suggestionScrollLock: false,
            // Misc
            screenWidth: document.documentElement.clientWidth,
            cardWidth: this.getCardWidth(document.documentElement.clientWidth),
            waterfallResponsive: document.documentElement.clientWidth > 767,
            scrollTop: 0,
            // style
            iPadStyle: /iPad/i.test(navigator.userAgent),
            // notification
            notification: null,
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
    beforeCreate() {
        // 设置一个全局map
        if (!window.pixiviz.infoMap) {
            window.pixiviz.infoMap = {};
        }
    },
    mounted() {
        // 检查屏蔽
        this.checkBlocked();
        // 检查建议词
        if (this.keyword !== this.$store.state.search.keyword) {
            this.fetchSuggestion();
        }
        this.checkIfId();
        // update store
        this.$store.commit('search/setKeyword', this.keyword);
        // Set scroll to last state
        const scrollTop = this.$cookies.get("search-scroll");
        if (scrollTop) {
            window.scrollTo(0, scrollTop);
        }
        // Add resize event listener
        this.$nextTick(() => {
            window.addEventListener("resize", this.windowResized, false);
            window.addEventListener("scroll", this.handleScroll, false);
        });
        // change title
        document.title = this.keyword + ' - Pixiviz';
    },
    destroyed() {
        // 清除监听器
        this.leaveSuggestion();
        window.removeEventListener("resize", this.windowResized, false);
        window.removeEventListener("scroll", this.handleScroll, false);
        if (this.notification) {
            this.notification.close();
        }
    },
    methods: {
        infiniteHandler($state) {
            // 屏蔽了就不发包
            if (this.keywordBlocked) {
                return;
            }
            this.axios
                .get(`${CONFIG.OWN_API}/illust/search`, {
                    params: {
                        word: this.keyword,
                        page: this.page,
                    }
                })
                .then(response => {
                    if (!response.data.illusts) {
                        // 加载失败
                        $state.complete();
                        return;
                    }
                    if (response.data.illusts.length === 0) {
                        // 无数据
                        $state.complete();
                        return;
                    }
                    let images = response.data.illusts.filter(img => {
                        if (img.x_restrict || img.sanity_level > 5) {
                            return false;
                        }
                        if (!window.pixiviz.infoMap[img.id]) window.pixiviz.infoMap[img.id] = img;
                        return true;
                    });
                    this.images = this.images.concat(images);
                    // 缓存 images
                    this.$store.commit("search/setImages", this.images);
                    // 设置 Load 状态为 false
                    this.$refs.waterfall.firstLoad = false;
                    // Page + 1
                    this.page = this.page + 1;
                    this.$store.commit("search/setPage", this.page);
                    $state.loaded();
                });
        },
        fetchSuggestion() {
            this.axios
                .get(
                    `${CONFIG.PIXIVIC_API}/keywords/${this.keyword}/pixivSuggestions`
                )
                .then(response => {
                    if (response.data.data) {
                        this.suggestions = response.data.data;
                        this.$store.commit('search/setSuggestions', this.suggestions);
                    }
                });
        },
        checkIfId() {
            // 检查关键词是不是纯数字
            if (id_matcher.test(this.keyword) && !isNaN(this.keyword)) {
                this.axios.get(`${CONFIG.OWN_API}/illust/detail`, {
                    params: {
                        id: parseInt(this.keyword)
                    }
                }).then(res => {
                    if (!res.data.illust) {
                        return;
                    }
                    // bind event to search notify
                    document.body.addEventListener('click', this.searchNotifyClicked, false);
                    this.notification = this.$notify({
                        title: '您要找的可能是：',
                        position: 'bottom-left',
                        dangerouslyUseHTMLString: true,
                        duration: 5000,
                        onClose: this.searchNotifyClosed,
                        message: `
                        <div class="search-notify">
                            <span data-name="search-notify">${res.data.illust.title} （ID: ${this.keyword}）</span>
                        </div>`
                    });
                });
            }
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
        checkBlocked() {
            // 检查屏蔽
            let flag_blocked = false;
            this.blockedCountTime = parseInt(window.localStorage.getItem('blocked_count_time'));
            if (new Date().valueOf() - this.blockedCountTime > 180000) {
                this.blockedCount = 1;
                window.localStorage.setItem('blocked_count', 1);
                window.localStorage.setItem('blocked_count_time', new Date().valueOf());
            } else {
                this.blockedCount = parseInt(window.localStorage.getItem('blocked_count'), 10);
                if (!this.blockedCount) {
                    window.localStorage.setItem('blocked_count', 1);
                    window.localStorage.setItem('blocked_count_time', new Date().valueOf());
                } else {
                    window.localStorage.setItem('blocked_count', this.blockedCount + 1);
                    window.localStorage.setItem('blocked_count_time', new Date().valueOf());
                }
            }
            for (let pattern of BLOCK_WORDS) {
                if (pattern.test(this.keyword)) {
                    flag_blocked = true;
                }
            }
            this.keywordBlocked = flag_blocked;
        },
        handleKeywordChanged(keyword) {
            this.keyword = keyword;
            this.keywordInput = keyword;
            // 检查屏蔽
            this.checkBlocked();
            // update store
            this.$store.commit('search/setKeyword', this.keyword);
            this.$store.commit('search/setImages', []);
            this.$store.commit('search/setPage', 1);
            // refresh
            this.refreshWaterfall();
            this.resetScrollState();
            this.fetchSuggestion();
            this.checkIfId();
            // change title
            document.title = this.keyword + ' - Pixiviz';
        },
        handleCardClicked(imageId) {
            this.$cookies.set(
                "pic-from",
                `search/${this.$route.params.keyword}`,
                "20min"
            );
            // 设置图片缓存
            const info = window.pixiviz.infoMap[imageId];
            if (info) {
                this.$store.commit('imageCache/setCache', info);
            }
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
            if (!this.$refs.suggestions) {
                return;
            }
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
        },
        // 通知事件
        searchNotifyClicked(e) {
            if (e.target.dataset.name && e.target.dataset.name === 'search-notify') {
                // 添加来源
                this.$cookies.set(
                    "pic-from",
                    `search/${this.$route.params.keyword}`,
                    "20min"
                );
                // this.keyword此处等同于pic id
                this.$router.push(`/pic/${this.keyword}`);
                this.notification.close();
            }
        },
        searchNotifyClosed() {
            document.body.removeEventListener('click', this.searchNotifyClicked, false);
        }
    }
};
</script>