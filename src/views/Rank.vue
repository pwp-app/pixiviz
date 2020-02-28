<template>
    <div class="rank-container">
        <div class="rank-header">
            <div class="rank-header-title">
                <span>排行榜</span>
                <div class="rank-header-title-category">
                    <span>{{modeText}}</span>
                    <el-popover
                        placement="bottom"
                        class="rank-category-popover"
                        width="380"
                        trigger="click"
                    >
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
                <div class="rank-body-date-item rank-body-date-back">
                    <i class="el-icon-arrow-left"></i>
                    <span>{{backDateText}}{{dateUnit}}</span>
                </div>
                <div class="rank-body-date-item rank-body-date-date">
                    <span>{{displayDate}}</span>
                </div>
                <div class="rank-body-date-item rank-body-date-next">
                    <span>{{nextDateText}}{{dateUnit}}</span>
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
            <div class="rank-body-content">
                <div class="waterfall-wrapper">
                    <Waterfall ref="waterfall" :images="images" />
                </div>
            </div>
        </div>
        <infinite-loading @infinite="infiniteHandler" spinner="spiral"></infinite-loading>
        <BackToTop/>
    </div>
</template>

<script>
import Waterfall from "../components/common/Waterfall";
import BackToTop from '../components/common/BackToTop';
import dayjs from "dayjs";

export default {
    name: "Rank",
    components: {
        Waterfall,
        BackToTop
    },
    data() {
        return {
            // Waterfall Data
            page: this.$store.state.rank.page ? this.$store.state.rank.page : 1,
            pageSize: 30,
            dateObject: this.$store.state.rank.date ? this.$store.state.rank.date : dayjs().subtract(3, "day"),
            mode: this.$store.state.rank.mode ? this.$store.state.rank.mode : this.$cookies.get("rank-mode") ? this.$cookies.get("rank-mode") : "day",
            images: this.$store.state.rank.images ? this.$store.state.rank.images : [],
            // Time
            backDateText: "前一",
            nextDateText: "后一",
            // Misc
            routeFrom: ''
        };
    },
    computed: {
        date: function() {
            return this.dateObject.format("YYYY-MM-DD");
        },
        modeText: function() {
            if (this.mode == "day") {
                return "日排行榜";
            } else if (this.mode == "week") {
                return "周排行榜";
            } else if (this.mode == "month") {
                return "月排行榜";
            }
        },
        dateUnit: function() {
            if (this.mode.indexOf("day") != -1) {
                return "天";
            } else if (this.mode.indexOf("week") != -1) {
                return "周";
            } else if (this.mode.indexOf("month") != -1) {
                return "月";
            }
        },
        displayDate: function() {
            if (this.mode.indexOf("day") != -1) {
                return this.dateObject.format("YYYY-MM-DD");
            } else if (this.mode.indexOf("week") != -1) {
                return this.dateObject.format("YYYY-MM") + " 第" + Math.round(this.dateObject.date() / 7) + " 周";
            } else if (this.mode.indexOf("month") != -1) {
                return this.dateObject.format("YYYY-MM");
            }
        }
    },
    watch: {
        /* If changed, then cache it */
        images() {
            this.$store.commit('rank/setImages', this.images);
        },
        dateObject() {
            this.$store.commit('rank/setDate', this.dateObject);
        },
        page() {
            this.$store.commit('rank/setPage', this.page);
        },
        mode() {
            this.$store.commit('rank/setMode', this.mode);
        }
    },
    mounted() {
        // Get cookies
        this.routeFrom = this.$cookies.get('rank-from');
        if (!this.routeFrom) {
            this.routeFrom = 'Landing'
        }
    },
    methods: {
        infiniteHandler($state) {
            this.axios
                .get("https://api.pixivic.com/ranks", {
                    params: {
                        mode: this.mode,
                        date: this.date,
                        page: this.page,
                        pageSize: this.pageSize
                    }
                })
                .then((response, state) => {
                    if (!response.data.data) {
                        // 加载失败
                        $state.complete();
                    }
                    this.images = this.images.concat(response.data.data);
                    // 设置瀑布流的 firstLoad 为 false
                    this.$refs.waterfall.firstLoad = false;
                    // Page + 1
                    this.page = this.page + 1;
                    $state.loaded();
                });
        },
        handleBack() {
            this.$router.push({
                name: this.routeFrom
            })
        }
    }
};
</script>