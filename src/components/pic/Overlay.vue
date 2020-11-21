<template>
  <div class="pic-overlay">
    <div class="pic-overlay-wrapper">
      <div class="pic-overlay-icon">
        <i class="el-icon-warning-outline"/>
      </div>
      <div class="pic-overlay-tip">
        <span>{{text}}</span>
      </div>
      <div class="pic-overlay-back" v-if="showBack">
        <el-button type="primary" round @click="handleRefresh" v-if="showRefresh">刷新</el-button>
        <el-button type="primary" round @click="handleBack">返回</el-button>
      </div>
      <div class="pic-overlay-back" v-if="!showBack">
        <el-button type="primary" round @click="handleRefresh" v-if="showRefresh">刷新</el-button>
        <el-button type="primary" round @click="handleBackLanding">返回主页</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pic.Overlay',
  props: ['text', 'showRefresh'],
  data() {
    return {
      showBack: false
    }
  },
  mounted() {
    if (this.$cookies.get('pic-from')) {
      this.showBack = true;
    }
  },
  methods: {
    handleBack() {
      window.history.go(-1);
    },
    handleRefresh() {
      window.location.reload();
    },
    handleBackLanding() {
      this.$router.push('/');
    }
  }
}
</script>