/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  keyword: null,
  images: null,
  page: null,
  suggestions: null,
  mode: 'pic',
};

const mutations = {
  setKeyword(state, keyword) {
    state.keyword = keyword;
  },
  setImages(state, images) {
    state.images = images;
  },
  setPage(state, page) {
    state.page = page;
  },
  setSuggestions(state, suggestions) {
    state.suggestions = suggestions;
  },
  setMode(state, mode) {
    state.mode = mode;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
