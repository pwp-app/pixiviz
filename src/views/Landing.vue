<template>
    <div class="landing-container">
        <div class="landing"
            v-lazy:background-image="landingBG"
            >
            <div class="landing-content">
                <BannerPlaceholder class="landing-card" ref="bannerPlaceholder" />
                <SearchPlaceholder class="landing-card" />
                <RankPlaceholder class="landing-card" />
            </div>
            <div class="landing-real-content">
                <Banner class="landing-card" @expanded="handleExpanded" />
                <SearchBox class="landing-card" />
                <RankBox class="landing-card" />
            </div>
        </div>
    </div>
</template>

<script>
import Banner from '../components/landing/Banner';
import SearchBox from '../components/landing/SearchBox';
import RankBox from '../components/landing/RankBox';
// placeholder
import BannerPlaceholder from '../components/landing/BannerPlaceholder';
import SearchPlaceholder from '../components/landing/SearchBoxPlaceholder';
import RankPlaceholder from '../components/landing/RankBoxPlaceholder';

import CONFIG from '@/config.json';

export default {
    name: 'Landing',
    metaInfo: {
        title: 'Pixiviz',
        htmlAttrs: {
            lang: 'zh-CN'
        }
    },
    components: {
        Banner,
        SearchBox,
        RankBox,
        BannerPlaceholder,
        SearchPlaceholder,
        RankPlaceholder
    },
    data() {
        return {
            landingBG: require(`@/assets/images/landing${window.isSafari ? '.jpg' : '.webp'}`),
            bannerExpanded: false,
            guideNotice: null,
            notFirstUse: false,
        }
    },
    mounted() {
        this.checkFirstUse();
        this.displayDonate();
    },
    destroyed() {
        if (this.guideNotice) {
            this.guideNotice.close();
        }
        if (this.donateNotice) {
            this.donateNotice.close();
        }
    },
    methods: {
        // event
        handleExpanded(expanded) {
            this.$refs.bannerPlaceholder.expandedChanged(expanded);
        },
        // notification
        checkFirstUse() {
            if (!window.localStorage) {
                return;
            }
            const notFirstUse = window.localStorage.getItem('not-first-use');
            if (notFirstUse === 'true') {
                this.notFirstUse = true;
                return;
            }
            document.body.addEventListener('click', this.guideNoticeClicked, false);
            window.localStorage.setItem('not-first-use', true);
            this.guideNotice = this.$notify({
                title: '',
                position: 'top-right',
                customClass: 'oneline-notice-container',
                dangerouslyUseHTMLString: true,
                duration: 5000,
                onClose: this.guideNoticeClosed,
                message: `
                    <div class="oneline-notice">
                        <span data-name="notice-firstuse">第一次使用 Pixiviz？你可能需要<span class="notice-link" data-name="link-guide">食用指南</span></span>
                    </div>`
            });
        },
        displayDonate() {
            if (this.notFirstUse) {
                return;
            }
            // 同一个设备7天内只展示一次
            const lastShowDonate = window.localStorage.getItem('last-show-donate');
            if (lastShowDonate && new Date().valueOf() / 1000 - parseInt(lastShowDonate, 10) < 604800) {
                return;
            }
            // 30%的概率展示通知
            if (Math.random() < 0.3) {
                window.localStorage.setItem('last-show-donate', new Date().valueOf());
                document.body.addEventListener('click', this.donateNoticeClicked, false);
                this.donateNotice = this.$notify({
                    title: '',
                    position: 'top-right',
                    customClass: 'oneline-notice-container',
                    dangerouslyUseHTMLString: true,
                    duration: 5000,
                    onClose: this.donateNoticeClosed,
                    message: `
                        <div class="oneline-notice">
                            <span data-name="notice-donate">帮助我们维持无广告运营 -&gt; <span class="notice-link" data-name="link-donate">点我发电</span></span>
                        </div>`
                });
            }
        },
        guideNoticeClicked(e) {
            if (e.target.dataset.name && e.target.dataset.name === 'link-guide') {
                if (window.isSafari) {
                    window.location.href = CONFIG.USE_GUIDE;
                } else {
                    window.open(CONFIG.USE_GUIDE, '_blank');
                }
                this.guideNotice.close();
                // 数据上报
                if (window.MtaH5) window.MtaH5.clickStat("guide_clicked");
            }
        },
        guideNoticeClosed() {
            document.body.removeEventListener('click', this.guideNoticeClicked, false);
        },
        donateNoticeClicked(e) {
            if (e.target.dataset.name && e.target.dataset.name === 'link-donate') {
                if (window.isSafari) {
                    window.location.href = CONFIG.DONATE;
                } else {
                    window.open(CONFIG.DONATE, '_blank');
                }
                this.donateNotice.close();
                // 数据上报
                if (window.MtaH5) window.MtaH5.clickStat("donate_clicked");
            }
        },
        donateNoticeClosed() {
            document.body.addEventListener('click', this.donateNoticeClicked, false);
        }
    }
}
</script>
