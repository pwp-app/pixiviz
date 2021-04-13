/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  image: null,
};

const mutations = {
  setCache(state, image) {
    state.image = image;
  },
  destroy(state) {
    state.image = null;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
