<template>
  <div
    class="sponsor-container"
    v-loading="loading"
    v-if="!loadError"
    element-loading-text="数据加载中..."
  >
    <div class="sponsor" v-if="!loading">
      <div class="sponsor-header">
        <Battery class="sponsor-header__icon" />
        <p class="sponsor-header__title">感谢发电</p>
        <i class="sponsor-header__close"></i>
      </div>
      <div class="sponsor-amount">
        <div class="sponsor-amount-item">
          <div class="sponsor-amount-item__title">
            上月发电
          </div>
          <div class="sponsor-amount-item__num">
            <span class="number">{{ lastMonthAmount }}<span class="unit">kWh</span></span>
          </div>
        </div>
        <div class="sponsor-amount-item">
          <div class="sponsor-amount-item__title">
            本月发电
          </div>
          <div class="sponsor-amount-item__num">
            <span class="number">{{ currentMonthAmount }} <span class="unit">kWh</span></span>
          </div>
        </div>
        <div class="sponsor-amount-item">
          <div class="sponsor-amount-item__title">
            总发电量
          </div>
          <div class="sponsor-amount-item__num">
            <span class="number">{{ totalAmount }}<span class="unit">kWh</span></span>
          </div>
        </div>
      </div>
      <div class="sponsor-list">
        <div
          :class="{
            'sponsor-list__top': true,
            'sponsor-list__top--no-normal': !normalSponsors.length,
          }"
          v-if="topSponsors.length"
        >
          <Sponsor
            v-for="sponsor in topSponsors"
            :sponsor="sponsor"
            :key="sponsor.user_id"
            type="top"
          ></Sponsor>
        </div>
        <div
          :class="{
            'sponsor-list__normal': true,
            'sponsor-list__normal--no-top': !topSponsors.length,
          }"
          v-if="normalSponsors.length"
        >
          <Sponsor
            v-for="sponsor in normalSponsors"
            :sponsor="sponsor"
            :key="sponsor.user_id"
            type="normal"
          ></Sponsor>
        </div>
        <div class="sponsor-list__placeholder" v-if="!topSponsors.length && !normalSponsors.length">
          <span>本月暂无发电</span>
        </div>
      </div>
      <div class="sponsor-footer">
        <div class="sponsor-footer__text">
          <p>每一次发电对我们来说都是非常大的帮助~</p>
          <p>感谢大家的支持 ❤</p>
        </div>
        <div class="sponsor-footer__desc">
          <p><span class="mobile-hide">数据每小时更新，最后</span>更新于 {{ lastUpdateTime }}</p>
        </div>
        <div class="sponsor-footer__op">
          <span>说明</span>
          <span>点我发电</span>
          <span>所有发电员</span>
        </div>
      </div>
      <Overlay text="发电数据加载失败" v-if="loadError" />
    </div>
  </div>
</template>

<script>
import { checkTrustHost } from '@/util/host';
import Battery from '../components/icons/battery.vue';
import Overlay from '../components/pic/Overlay';
import Sponsor from '../components/sponsor/Sponsor.vue';
import dayjs from 'dayjs';

export default {
  components: {
    Battery,
    Overlay,
    Sponsor,
  },
  data() {
    return {
      info: null,
      loading: true,
      loadError: false,
      allSponsor: null,
      allSponsorLoading: true,
      allSponsorLoadError: false,
    };
  },
  computed: {
    lastMonthAmount() {
      if (this.info?.amount) {
        return parseFloat(this.info.amount.last_month).toFixed(2);
      }
      return '';
    },
    currentMonthAmount() {
      if (this.info?.amount) {
        return parseFloat(this.info.amount.current_month).toFixed(2);
      }
      return '';
    },
    totalAmount() {
      if (this.info?.amount) {
        return parseFloat(this.info.amount.total).toFixed(2);
      }
      return '';
    },
    topSponsors() {
      if (!this.info?.sponsors?.current) {
        return [];
      }
      return this.info.sponsors?.current.filter((sponsor) => sponsor.current_plan_price >= 50);
    },
    normalSponsors() {
      if (!this.info?.sponsors?.current) {
        return [];
      }
      const topSponsorIds = this.topSponsors.map((sponsor) => sponsor.user_id);
      return this.info.sponsors?.current.filter(
        (sponsor) => !topSponsorIds.includes(sponsor.user_id),
      );
    },
    lastUpdateTime() {
      if (!this.info) {
        return '';
      }
      return dayjs(this.info.last_update_time).format('YYYY-MM-DD HH:mm:ss');
    },
  },
  created() {
    // if not trusted domain, go index
    if (!checkTrustHost(this.$config)) {
      this.$router.replace('/404');
      return;
    }
    this.loadInfo();
  },
  methods: {
    async loadInfo() {
      const res = await this.axios.get(`${this.$config.afdian_manage_api}/current`);
      if (!res || res.status !== 200 || !res.data?.success) {
        this.loadError = true;
        return;
      }
      this.$set(this, 'info', res.data.data);
      this.loading = false;
    },
    async loadAllSponsor() {
      const res = await this.axios.get(`${this.$config.afdian_manage_api}/allSponsors`);
      if (!res || res.status !== 200 || !res.data?.success) {
        this.allSponsorLoadError = true;
        return;
      }
      this.$set(this, 'allSponsor', res.data.data);
      this.allSponsorLoading = false;
    },
  },
};
</script>
