<template>
  <div class="artist-info-tag">
    <div class="artist-info-tag__content">{{ content }}</div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['content'],
};
</script>
