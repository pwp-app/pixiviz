<template>
  <span
    :class="{
      'sync-status': true,
      'sync-status--syncing': status === 'syncing',
      'sync-status--completed': status && status !== 'syncing',
      'sync-status--error': status === 'error',
    }"
    @click="handleClicked"
  >
    <Sync class="sync-status__icon sync-status__icon-sync" v-if="status === 'syncing'" />
    <SyncError class="sync-status__icon sync-status__icon-error" v-if="status === 'error'" />
    <CloudDone class="sync-status__icon sync-status__icon-done" v-if="status === 'done'" />
    <div class="sync-status__text">{{ syncStatusText }}</div>
  </span>
</template>

<script>
import Sync from '../icons/sync.vue';
import SyncError from '../icons/syncError.vue';
import CloudDone from '../icons/cloudDone.vue';

export default {
  props: {
    status: {
      type: String,
    },
  },
  components: {
    Sync,
    SyncError,
    CloudDone,
  },
  computed: {
    syncStatusText() {
      if (this.status === 'syncing') {
        return '正在努力同步数据中...';
      }
      if (this.status === 'error') {
        return '同步失败';
      }
      if (this.status === 'done') {
        return '同步完成';
      }
      return '';
    },
  },
  methods: {
    handleClicked() {
      if (this.status !== 'error') {
        return;
      }
      this.$emit('retry');
    },
  },
};
</script>
