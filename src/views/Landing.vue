<template>
    <div class="landing-container">
        <div class="landing">
            <Banner class="landing-card" />
            <SearchBox class="landing-card" />
            <RankBox />
        </div>
    </div>
</template>

<script>
import Banner from '../components/landing/Banner';
import SearchBox from '../components/landing/SearchBox';
import RankBox from '../components/landing/RankBox';

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
        RankBox
    },
    data() {
        return {
            bannerExpanded: false,
            guideNotice: null
        }
    },
    mounted() {
        this.checkFirstUse();
    },
    destroyed() {
        if (this.notification) {
            this.notification.close();
        }
    },
    methods: {
        checkFirstUse() {
            if (!window.localStorage) {
                return;
            }
            const not_first_use = window.localStorage.getItem('not-first-use');
            if (not_first_use) {
                return;
            }
            document.body.addEventListener('click', this.guideNoticeClicked, false);
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
        guideNoticeClicked(e) {
            if (e.target.dataset.name && e.target.dataset.name === 'link-guide') {
                if (window.isSafari) {
                    window.location.href = CONFIG.USE_GUIDE;
                } else {
                    window.open(CONFIG.USE_GUIDE, '_blank');
                }
                this.guideNotice.close();
            }
        },
        guideNoticeClosed() {
            window.localStorage.setItem('not-first-use', true);
            document.body.removeEventListener('click', this.guideNoticeClicked, false);
        }
    }
}
</script>