const state = {
  progress: 0
};

const mutations = {
  setProgress(state, progress) {
    state.progress = progress;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
