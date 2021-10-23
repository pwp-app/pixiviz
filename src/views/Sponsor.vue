<template>
  <div class="sponsor">
    <div class="sponsor-header">
      <div class="sponsor-header__icon">
        <Battery />
      </div>
      <span class="sponsor-header__title">感谢发电！</span>
    </div>
    <div class="sponsor-list"></div>
  </div>
</template>

<script>
import Battery from '../components/icons/battery.vue';

export default {
  components: {
    Battery,
  },
};
</script>
