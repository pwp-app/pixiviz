<template>
    <div class="rank-container">
        <div class="rank-header">
            <div class="rank-header-title">
                <span>排行榜</span>
                <div class="rank-header-title-category">
                    <span>{{formatMode(mode)}}</span>
                </div>
            </div>
        </div>
        <div class="rank-body">
            <div class="rank-body-date">

            </div>
            <div class="rank-body-content">
                <div class="waterfall-wrapper">
                    <Waterfall ref="waterfall" :images="images"/>
                </div>
            </div>
        </div>
        <infinite-loading @infinite="infiniteHandler" spinner="spiral"></infinite-loading>
    </div>
</template>

<script>
import Waterfall from '../components/common/Waterfall';
import dayjs from 'dayjs';

export default {
    name: 'Rank',
    components: {
        Waterfall
    },
    data() {
        return {
            page: 1,
            pageSize: 30,
            date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
            mode: this.$cookies.get('rank-mode') ? this.$cookies.get('rank-mode') : 'day',
            images: []
        }
    },
    methods: {
        formatMode(mode) {
            if (mode == 'day') {
                return '日排行榜';
            }
            else if (mode == 'week') {
                return '周排行榜';
            }
            else if (mode == 'month') {
                return '月排行榜';
            }
        },
        infiniteHandler($state) {
            this.axios.get('https://api.pixivic.com/ranks', {
                params: {
                    mode: this.mode,
                    date: this.date,
                    page: this.page,
                    pageSize: this.pageSize
                }
            }).then((response, state) => {
                if (!response.data.data) {
                    // 加载失败
                    $state.completed();
                }
                this.images = this.images.concat(response.data.data);
                // 设置瀑布流的 firstLoad 为 false
                this.$refs.waterfall.firstLoad = false;
                // Page + 1
                this.page = this.page + 1
                $state.loaded();
            })
        }
    }
}
</script>