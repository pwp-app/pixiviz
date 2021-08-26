<template>
  <div class="maintain-wrapper" v-if="display">
    <div class="maintain">
      <div class="maintain-icon">
        <Construction></Construction>
      </div>
      <div class="maintain-text">
        <div class="maintain-text--default">
          <span>站点维护中</span>
        </div>
        <div
          :class="{
            'maintain-text--custom': true,
            'maintain-text--custom-long': isLongText,
          }"
          v-if="displayText"
        >
          <span>{{ displayText }}</span>
        </div>
      </div>
    </div>
    <div class="maintain-footer">
      <span>Pixiviz v{{ version }}</span>
    </div>
  </div>
</template>

<script>
import Construction from '../icons/construction.vue';
import { version } from '../../version';

export default {
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  components: { Construction },
  data() {
    return {
      display: false,
      version,
    };
  },
  computed: {
    displayText() {
      return this.text ? this.text.trim() : null;
    },
    isLongText() {
      return this.text.length > 14;
    },
  },
  methods: {
    show() {
      this.display = true;
    },
  },
};
</script>
