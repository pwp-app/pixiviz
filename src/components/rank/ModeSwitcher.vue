<template>
    <div class="rank-mode-switcher">
        <div class="rank-mode-switcher-title">
            <span>选择排行榜</span>
        </div>
        <div class="rank-mode-switcher-body">
            <div class="rank-mode-item-row">
                <div class="rank-mode-item-tag">
                    <span>综合</span>
                </div>
                <div class="rank-mode-item">
                    <span>月排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>周排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>日排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>男性日排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>女性日排行榜</span>
                </div>
            </div>
            <div class="rank-mode-item-row">
                <div class="rank-mode-item-tag">
                    <span>漫画</span>
                </div>
                <div class="rank-mode-item">
                    <span>月排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>周排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>日排行榜</span>
                </div>
                <div class="rank-mode-item">
                    <span>新秀周排行榜</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Rank.ModeSwitcher',
    props: ['mode']
}
</script>