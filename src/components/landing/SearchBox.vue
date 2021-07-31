<template>
  <div :class="['searchbox-wrapper', bannerExpanded ? 'searchbox-hide' : '']" v-show="show">
    <div class="searchbox">
      <div class="searchbox-title">
        <span
          >寻找你<el-dropdown @command="handleModeChanged" trigger="click" placement="bottom">
            <span>{{ searchModeText }}</span>
            <el-dropdown-menu class="search-dropdown" slot="dropdown">
              <el-dropdown-item command="pic" v-if="searchMode !== 'pic'">
                想看的画作
              </el-dropdown-item>
              <el-dropdown-item command="user" v-if="searchMode !== 'user'">
                喜欢的画师
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </span>
      </div>
      <div class="searchbox-input">
        <el-input v-model="search" spellcheck="false" @keyup.enter.native="submitSearch"></el-input>
      </div>
      <div class="searchbox-button">
        <button @click="handleSearchClick"><i class="el-icon-search"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Landing.SearchBox',
  data() {
    return {
      show: true,
      search: '',
      bannerExpanded: false,
      searchMode: this.$store.state.search.mode || 'pic',
    };
  },
  computed: {
    searchModeText() {
      return this.searchMode === 'pic' ? '想看的画作' : '喜欢的画师';
    },
  },
  watch: {
    '$store.state.landingBanner.expanded': function (expanded) {
      if (expanded) {
        this.bannerExpanded = expanded;
        setTimeout(() => {
          this.show = false;
        }, 500);
      } else {
        this.show = true;
        setTimeout(() => {
          this.bannerExpanded = expanded;
        }, 150);
      }
    },
  },
  methods: {
    submitSearch() {
      let search;
      if (!this.search) {
        this.$message.error('呐，输入关键词再搜索！！');
        return;
      }
      if (this.search) {
        search = this.search.trim();
        if (search.length < 1) {
          this.$message.error('呐，输入关键词再搜索！！');
          this.search = '';
          return;
        }
      }
      if (this.searchMode === 'pic') {
        this.$router.push({
          name: 'Search',
          params: {
            keyword: this.search,
          },
        });
        this.$cookies.set('search-from', '', '1h');
      } else if (this.searchMode === 'user') {
        this.$router.push({
          name: 'UserSearch',
          params: {
            keyword: this.search,
          },
        });
        this.$cookies.set('usearch-from', '', '1h');
      }
    },
    handleSearchClick() {
      this.submitSearch();
    },
    handleModeChanged(command) {
      this.searchMode = command;
      this.$store.commit('search/setMode', this.searchMode);
    },
  },
};
</script>
