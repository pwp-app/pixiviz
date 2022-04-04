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
        <i class="el-icon-close sponsor-header__close" @click="handleBack"></i>
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
          <p>❤ 感谢大家的支持 ❤</p>
        </div>
        <div class="sponsor-footer__desc">
          <p><span class="mobile-hide">数据每小时更新，最后</span>更新于 {{ lastUpdateTime }}</p>
        </div>
        <div class="sponsor-footer__op">
          <span @click="() => (this.showDesc = true)">说明</span>
          <span @click="openAfdian">点我发电</span>
          <span @click="() => (this.showAll = true)">所有发电员</span>
        </div>
      </div>
      <Overlay text="发电数据加载失败" v-if="loadError" />
    </div>
    <el-dialog
      class="dialog dialog-sponsor-desc"
      width="780px"
      title="发电说明"
      :visible.sync="showDesc"
    >
      <pre v-html="sponsorDesc"></pre>
      <pre class="dialog-sponsor-desc__footer">Pixiviz 站务</pre>
    </el-dialog>
    <el-dialog
      class="dialog dialog-sponsor-all"
      top="24px"
      append-to-body
      title="所有发电员"
      :visible.sync="showAll"
    >
      <div class="all-sponsor" v-if="!allSponsorLoading && !allSponsorLoadError">
        <Sponsor
          v-for="sponsor in allSponsors"
          :key="sponsor.user_id"
          :sponsor="sponsor"
          type="all"
        ></Sponsor>
      </div>
      <div class="all-sponsor__load" v-else>
        <span>{{ allSponsorLoadText }}</span>
      </div>
    </el-dialog>
  </div>
  <div class="sponsor-error" v-else>
    <div class="sponsor-error-main">
      <div class="sponsor-error-main__icon">
        <i class="el-icon-warning-outline"></i>
      </div>
      <div class="sponsor-error-main__text">
        <span>赞助信息加载失败</span>
      </div>
      <div class="sponsor-error-main__action">
        <el-button type="primary" round @click="handleBack">返回主页</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { isEmail } from 'regex-go';
import { checkTrustHost } from '@/util/host';
import Battery from '../components/icons/battery.vue';
import Overlay from '../components/pic/Overlay';
import Sponsor from '../components/sponsor/Sponsor.vue';

const sponsorDesc = `
1. Pixiviz 为非营利性的网站，我们承诺获得的发电收入将完全投入到站点的维护与升级。
2. 我们承诺在发电可以维持站点正常运作的情况下，不会在站内嵌入任何形式的广告或付费功能。
3. 本页面所有数据来源于爱发电，本页面内 1 kWh = ￥1。
4. 爱发电为我们的唯一发电渠道，所有发电款项均通过爱发电收集、统计、结算。
5. 服务的每月固定支出和扩容所需支出均已公布在爱发电，支出数额为预估值，实际支出金额会有些许浮动。
6. 由于站点支出项目较多且所用服务器付费模式复杂，受限于精力，支出明细将不会公开，请您理解。
7. 为保护部分发电用户的隐私，我们会隐藏该用户的真实 ID。
`.trim();

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
      allSponsors: [],
      allSponsorLoading: true,
      allSponsorLoadError: false,
      showDesc: false,
      showAll: false,
      sponsorDesc,
    };
  },
  watch: {
    showAll: {
      handler(v) {
        if (v && !this.allSponsor) {
          this.loadAllSponsor();
        }
      },
    },
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
      try {
        return this.info.sponsors?.current
          .map((item) => {
            if (isEmail(item.name)) {
              return {
                ...item,
                name: `发电员#${
                  item.name.length > 6
                    ? item.name.slice(0, 6)
                    : item.name.slice(0, item.name.indexOf('@'))
                }`,
              };
            }
            return item;
          })
          .filter((sponsor) => sponsor.current_plan_price >= 50)
          .sort((a, b) => parseFloat(b.current_plan_price) - parseFloat(a.current_plan_price));
      } catch {
        return [];
      }
    },
    normalSponsors() {
      if (!this.info?.sponsors?.current) {
        return [];
      }
      const topSponsorIds = this.topSponsors.map((sponsor) => sponsor.user_id);
      try {
        return this.info.sponsors?.current
          .map((item) => {
            if (isEmail(item.name)) {
              return {
                ...item,
                name: `发电员#${
                  item.name.length > 6
                    ? item.name.slice(0, 6)
                    : item.name.slice(0, item.name.indexOf('@'))
                }`,
              };
            }
            return item;
          })
          .filter((sponsor) => !topSponsorIds.includes(sponsor.user_id))
          .sort((a, b) => parseFloat(b.current_plan_price) - parseFloat(a.current_plan_price));
      } catch {
        return [];
      }
    },
    lastUpdateTime() {
      if (!this.info) {
        return '';
      }
      return dayjs(this.info.last_update_time).format('YYYY-MM-DD HH:mm:ss');
    },
    allSponsorLoadText() {
      if (this.allSponsorLoadError) {
        return '数据加载失败';
      }
      if (this.allSponsorLoading) {
        return '数据加载中...';
      }
      return '';
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
      let res;
      try {
        res = await this.axios.get(`${this.$config.afdian_manage_api}/current`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load current sponsors', e);
        this.loadError = true;
        return;
      }
      if (!res || res.status !== 200 || !res.data?.success) {
        this.loadError = true;
        return;
      }
      this.$set(this, 'info', res.data.data);
      this.loading = false;
    },
    async loadAllSponsor() {
      let res;
      try {
        res = await this.axios.get(`${this.$config.afdian_manage_api}/allSponsors`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load all sponsors', e);
        this.loadError = true;
        return;
      }
      if (!res || res.status !== 200 || !res.data?.success) {
        this.allSponsorLoadError = true;
        return;
      }
      this.$set(
        this,
        'allSponsors',
        res.data.data.sponsors.sort((a, b) => {
          const diff = b.all_sum_amount - a.all_sum_amount;
          if (diff !== 0) {
            return diff;
          }
          return a.first_pay_time - b.first_pay_time;
        }),
      );
      this.allSponsorLoading = false;
    },
    openAfdian() {
      if (window.isSafari) {
        window.location.href = this.$config.donate_url;
      } else {
        window.open(this.$config.donate_url, '_blank');
      }
    },
    handleBack() {
      this.$router.push('/');
    },
  },
};
</script>
