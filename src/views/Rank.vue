<template>
    <div :class="['rank-container', iPadStyle ? 'ipad-only' : null]">
        <div class="rank-header">
            <div class="rank-header-title">
                <span>排行榜</span>
                <div class="rank-header-title-category">
                    <span>{{ modeText }}</span>
                    <el-popover
                        placement="bottom"
                        popper-class="rank-category-popover"
                        width="440"
                        trigger="click"
                    >
                        <ModeSwitcher :mode="mode" @mode-changed="handleModeChanged" />
                        <i class="el-icon-refresh" slot="reference"></i>
                    </el-popover>
                </div>
                <div class="rank-header-close">
                    <i class="el-icon-close" @click="handleBack"></i>
                </div>
            </div>
        </div>
        <div class="rank-body">
            <div class="rank-body-date">
                <div class="rank-body-date-item rank-body-date-back" @click="handleDateChanged(-1)">
                    <i class="el-icon-arrow-left"></i>
                    <span>{{ backDateText }}{{ dateUnit }}</span>
                </div>
                <el-popover
                    placement="bottom"
                    popper-class="rank-date-popover"
                    width="320"
                    trigger="click"
                >
                    <DateSwitcher
                        ref="dateSwitcher"
                        :date="dateObject"
                        @date-selected="handleDateSelected"
                    />
                    <div slot="reference" class="rank-body-date-item rank-body-date-date">
                        <span>{{ displayDate }}</span>
                    </div>
                </el-popover>
                <div
                    class="rank-body-date-item rank-body-date-next"
                    @click="handleDateChanged(1)"
                    v-show="showDateNext"
                >
                    <span>{{ nextDateText }}{{ dateUnit }}</span>
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
            <div class="rank-body-content">
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
                <!-- 针对移动端渲染一个不同的组件 -->
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
import dayjs from "dayjs";
// Common components
import Waterfall from "../components/common/Waterfall";
import BackToTop from "../components/common/BackToTop";
// Rank components
import ModeSwitcher from "../components/rank/ModeSwitcher";
import DateSwitcher from "../components/rank/DateSwitcher";
// Util
import MobileResponsive from "../util/MobileResponsive";

// config
import CONFIG from '../config.json';

export default {
    name: "Rank",
    metaInfo: {
        htmlAttrs: {
            lang: 'zh-CN',
        }
    },
    components: {
        Waterfall,
        BackToTop,
        ModeSwitcher,
        DateSwitcher
    },
    data() {
        return {
            // Waterfall Data
            page: this.$store.state.rank.page !== null ? this.$store.state.rank.page : 1,
            dateObject: this.$store.state.rank.date
                ? this.$store.state.rank.date
                : dayjs()
                    .subtract(1, "day")
                    .subtract(6, 'hour'),
            mode: this.$store.state.rank.mode
                ? this.$store.state.rank.mode
                : this.$cookies.get("rank-mode")
                    ? this.$cookies.get("rank-mode")
                    : "day",
            images: this.$store.state.rank.images
                ? this.$store.state.rank.images
                : [],
            // Time
            backDateText: "前一",
            nextDateText: "后一",
            // Misc
            routeFrom: "",
            waterfallIdentifier: Math.round(Math.random() * 100),
            screenWidth: document.documentElement.clientWidth,
            cardWidth: this.getCardWidth(document.documentElement.clientWidth),
            waterfallResponsive: document.documentElement.clientWidth > 767,
            scrollTop: 0,
            // style
            iPadStyle: /iPad/i.test(navigator.userAgent)
        };
    },
    computed: {
        date: function () {
            return this.dateObject.format("YYYY-MM-DD");
        },
        modeText: function () {
            const mode2text = {
                day: "日排行榜",
                week: "周排行榜",
                month: "月排行榜",
                day_manga: "漫画日排行榜",
                week_manga: "漫画周排行榜",
                month_manga: "漫画月排行榜",
                week_rookie_manga: "新秀周排行榜"
            };
            return mode2text[this.mode];
        },
        dateUnit: function () {
            if (this.mode.indexOf("day") != -1) {
                return "天";
            } else if (this.mode.indexOf("week") != -1) {
                return "周";
            } else if (this.mode.indexOf("month") != -1) {
                return "月";
            }
        },
        displayDate: function () {
            if (this.mode.indexOf("day") != -1) {
                return this.dateObject.format("YYYY-MM-DD");
            } else if (this.mode.indexOf("week") != -1) {
                return (
                    this.dateObject.format("YYYY-MM") +
                    " 第 " +
                    Math.round(this.dateObject.date() / 7) +
                    " 周"
                );
            } else if (this.mode.indexOf("month") != -1) {
                return this.dateObject.format("YYYY-MM");
            }
        },
        showDateNext: function () {
            return (
                (dayjs().startOf("day").unix() - this.dateObject.unix()) / 86400 > 1
            );
        }
    },
    watch: {
        /* If changed, then cache it */
        dateObject() {
            this.$store.commit("rank/setDate", this.dateObject);
        },
        page() {
            this.$store.commit("rank/setPage", this.page);
        },
        mode() {
            this.$store.commit("rank/setMode", this.mode);
        },
        /* Watch screen width */
        screenWidth(width) {
            this.screenWidth = width;
            // After waterfall rerendered, keep the scroll state
            this.scrollTop = document.documentElement.scrollTop;
            if (this.screenWidth <= 767) {
                this.waterfallResponsive = false;
            } else {
                this.waterfallResponsive = true;
            }
            this.$nextTick(() => {
                this.cardWidth = this.getCardWidth(this.screenWidth);
                document.documentElement.scrollTop = this.scrollTop
            });
        }
    },
    created() {
        // Get cookies
        this.routeFrom = this.$cookies.get("rank-from");
        if (!this.routeFrom) {
            this.routeFrom = "Landing";
        }
    },
    mounted() {
        // Do scroll when reset is not set
        const scrollTop = this.$cookies.get("rank-scroll");
        if (scrollTop) {
            window.scrollTo(0, scrollTop);
        }
        // Recheck rank mode
        const reset = this.$cookies.get("rank-reset");
        if (reset === 'true') {
            this.resetImmediate();
        }
        this.$cookies.remove('rank-reset');
        // Add window event listener
        this.$nextTick(() => {
            window.addEventListener("resize", this.windowResized, false);
            window.addEventListener("scroll", this.handleScroll, false);
        });
        // Change title
        document.title = this.modeText + ' - Pixiviz';
    },
    destroyed() {
        window.removeEventListener("scroll", this.handleScroll, false);
        window.removeEventListener("resize", this.windowResized, false);
    },
    methods: {
        infiniteHandler($state) {
            this.axios
                .get(`${CONFIG.OWN_API}/illust/rank`, {
                    params: {
                        mode: this.mode,
                        date: this.date,
                        page: this.page
                    }
                })
                .then((response, state) => {
                    if (!response.data || !response.data.illusts) {
                        // 加载失败
                        $state.complete();
                        return;
                    }
                    let images = response.data.illusts.filter(img => {
                        if (img.x_restrict || img.sanity_level > 5) {
                            return false;
                        }
                        return true;
                    });
                    this.images = this.images.concat(images);
                    // 缓存 images
                    this.$store.commit("rank/setImages", this.images);
                    // 设置 Load 状态为 false
                    this.$refs.waterfall.firstLoad = false;
                    // Page + 1
                    this.page = this.page + 1;
                    // 缓存 page
                    this.$store.commit('rank/setPage', this.page);
                    $state.loaded();
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
        reset() {
            // 提前清空 dom
            this.$refs.waterfall.$el.innerHTML = "";
            this.$nextTick(() => {
                // 重置参数
                this.page = 1;
                this.mode = this.$cookies.get("rank-mode") ? this.$cookies.get("rank-mode") : "day";
                this.dateObject = dayjs().subtract(1, "day").subtract(6, 'hour');
                this.images = [];
                this.waterfallIdentifier = this.waterfallIdentifier + 1;
            });
        },
        resetImmediate() {
            this.$refs.waterfall.$el.innerHTML = "";
            this.page = 1;
            this.mode = this.$cookies.get("rank-mode") ? this.$cookies.get("rank-mode") : "day";
            this.dateObject = dayjs().subtract(1, "day").subtract(6, 'hour');
            this.images = [];
            this.waterfallIdentifier = this.waterfallIdentifier + 1;
        },
        handleModeChanged(mode) {
            this.mode = mode;
            document.title = this.modeText + ' - Pixiviz';
            this.refreshWaterfall();
        },
        handleBack() {
            this.$router.push({
                name: this.routeFrom
            });
        },
        // 日期事件
        handleDateChanged(toward) {
            if (this.dateUnit == "天") {
                this.dateObject = this.dateObject.add(toward * 1, "day");
            } else if (this.dateUnit == "周") {
                this.dateObject = this.dateObject.add(toward * 1, "week");
            } else if (this.dateUnit == "月") {
                this.dateObject = this.dateObject.add(toward * 1, "month");
            }
            this.$refs.dateSwitcher.selectDate = this.dateObject.toDate();
            this.refreshWaterfall();
        },
        handleDateSelected(date) {
            this.dateObject = dayjs(date);
            this.refreshWaterfall();
        },
        // 跳转
        handleCardClicked(imageId) {
            this.$cookies.set("pic-from", "rank", "20min");
            this.$router.push("/pic/" + imageId);
        },
        // 窗口事件
        handleScroll() {
            this.$cookies.set("rank-scroll", document.documentElement.scrollTop, "20min");
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