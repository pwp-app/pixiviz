/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  keyword: null,
  artists: null,
  page: null,
};

const mutations = {
  setKeyword(state, keyword) {
    state.keyword = keyword;
  },
  setArtists(state, artists) {
    state.artists = artists;
  },
  setPage(state, page) {
    state.page = page;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
