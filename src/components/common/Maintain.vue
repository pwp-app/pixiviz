<template>
  <div class="maintain-wrapper" v-if="display">
    <div class="maintain">
      <div class="maintain-icon"></div>
      <div class="maintain-text">
        <div class="maintain-text--default">
          <span>站点维护中</span>
        </div>
        <div class="maintain-text--custom" v-if="displayText">
          <span>{{ displayText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      display: false,
    };
  },
  computed: {
    displayText() {
      return this.text ? this.text.trim() : null;
    },
  },
  methods: {
    show() {
      this.display = true;
    },
  },
};
</script>
