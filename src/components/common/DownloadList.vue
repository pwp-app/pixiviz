<template>
  <el-drawer
    class="download-list"
    title="下载列表"
    :visible.sync="showDrawer"
    @before-close="handleClose"
    >
      <template v-if="!empty">
        <DonwloadListItem
          v-for="item in items"
          :key="item.key"
          :item="item"
          />
      </template>
      <template v-else>
        <span class="download-list-empty">当前没有进行中的下载...</span>
      </template>
  </el-drawer>
</template>

<script>
import DonwloadListItem from './DownloadListItem';

export default {
  components: {
    DonwloadListItem,
  },
  data() {
    return {
      showDrawer: false,
      items: [],
    };
  },
  created() {
    this.$bus.$on('openDownloadList', this.show);
  },
  computed: {
    empty() {
      return this.$store.state.download.list < 1;
    }
  },
  methods: {
    show() {
      if (!this.showDrawer) {
        this.showDrawer = true;
      }
      this.refreshList();
      this.timer = setInterval(this.refreshList, 1000);
    },
    handleClose() {
      clearInterval(timer);
      timer = null;
    },
    refreshList() {
      const list = this.$store.state.download.list;
      if (list.length < 1) {
        return;
      }
      const items = [];
      list.forEach((item, index) => {
        items.push({
          key: `${item.name}_${index}`,
          name: item.name,
          progress: item.image.percent || 0,
        });
      });
      this.items = items;
    }
  }
}
</script>