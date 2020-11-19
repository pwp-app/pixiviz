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
    <el-dialog
      :title="announceTitle"
      :visible.sync="showAnnounce"
      :before-close="handleAnnounceClose"
      class="landing-announcement"
      top="8.5vh"
      >
      <pre>{{announceContent}}</pre>
      <pre class="annouce-footer">{{announceFooter}}</pre>
    </el-dialog>
  </div>
</template>

<script>
import dayjs from 'dayjs';
// components
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
      guideNotice: null,
      notFirstUse: false,
      announceId: -1,
      announceTitle: '',
      announceFooter: '',
      showAnnounce: false,
      announceContent: false,
    }
  },
  mounted() {
    this.fetchAnnounce();
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
    // announce
    fetchAnnounce() {
      this.axios.get('https://config.backrunner.top/pixiviz/announcement.json', {
        withCredentials: false,
      }).then((res) => {
        if (res.data) {
          const { id, title, content, footer, expires } = res.data;
          const announceLog = window.localStorage.getItem('announce-read-id');
          if (announceLog && parseInt(announceLog, 10) >= id) {
            return;
          }
          if (dayjs(expires).unix() <= dayjs().unix()) {
            return;
          }
          this.announceId = id;
          this.announceTitle = title;
          this.announceContent = content;
          this.announceFooter = footer;
          this.showAnnounce = true;
        }
      });
    },
    handleAnnounceClose(done) {
      window.localStorage.setItem('announce-read-id', this.announceId);
      done();
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
			this.$nextTick(() => {
				this.guideNotice = this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 8000,
        onClose: this.guideNoticeClosed,
        message: `
          <div class="oneline-notice">
            <span data-name="notice-firstuse">第一次使用 Pixiviz？你可能需要<span class="notice-link" data-name="link-guide">食用指南</span></span>
          </div>`
      	});
			});
    },
    displayDonate() {
      if (!this.notFirstUse) {
        return;
      }
      // 同一个设备7天内只展示一次
      const lastShowDonate = window.localStorage.getItem('last-show-donate');
      if (lastShowDonate && (new Date().valueOf() - parseInt(lastShowDonate, 10)) / 1000 < 604800) {
        return;
      }
      // 50%的概率展示通知
      if (Math.random() < 0.5) {
        window.localStorage.setItem('last-show-donate', new Date().valueOf());
				document.body.addEventListener('click', this.donateNoticeClicked, false);
				this.$nextTick(() => {
					this.donateNotice = this.$notify({
						title: '',
						position: 'top-right',
						customClass: 'oneline-notice-container',
						dangerouslyUseHTMLString: true,
						duration: 10000,
						onClose: this.donateNoticeClosed,
						message: `
							<div class="oneline-notice">
								<span data-name="notice-donate">感谢您使用 Pixiviz，欢迎您通过捐赠来帮助我们维持无广告运营 -&gt; <span class="notice-link" data-name="link-donate">点我发电</span></span>
							</div>`
					});
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
