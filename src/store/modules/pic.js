/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  progress: 0,
  ugoiraProgress: 0,
  ugoiraStatus: null,
};

const mutations = {
  setProgress(state, progress) {
    state.progress = progress;
  },
  setUgoiraProgress(state, progress) {
    state.ugoiraProgress = progress;
  },
  setUgoiraStatus(state, status) {
    state.ugoiraStatus = status;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
