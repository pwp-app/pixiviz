<template>
  <div :class="`sponsor-${type}`">
    <div :class="`sponsor-${type}__avatar`" v-lazy-container :style="avatar"></div>
    <div class="sponsor-text">
      <div :class="`sponsor-${type}__name`">{{ sponsor.name }}</div>
      <div :class="`sponsor-${type}__price`">
        <span class="number">{{ sponsor.current_plan_price }}</span
        ><span class="unit">kWh</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sponsor: {
      type: Object,
    },
    type: {
      type: String,
    },
  },
  computed: {
    avatar() {
      return `background-image: url(${this.sponsor.avatar}?imageView2/1/w/140/h/140);`;
    },
  },
};
</script>
