/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  enabled: window.pixiviz.darkMode,
};

const mutations = {
  setEnabled(state, value) {
    state.enabled = value;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
