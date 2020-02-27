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
                    <Waterfall ref="waterfall" @load="loadData" :images="images"/>
                </div>
            </div>
        </div>
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
        loadData(page, pageSize) {
            this.axios.get('https://api.pixivic.com/ranks', {
                params: {
                    mode: this.mode,
                    date: this.date,
                    page: this.page,
                    pageSize: this.pageSize
                }
            }).then(response => {
                if (!response.data.data) {
                    // 加载失败
                }
                this.images = response.data.data;
                // 设置瀑布流的 firstLoad 为 false
                this.$refs.waterfall.firstLoad = false;
            })
        }
    }
}
</script>