const state = {
  list: [],
};

const mutations = {
  addItem(state, item) {
    state.list.push(item);
  },
  removeItem(state, name) {
    state.list.splice(
      state.list.findIndex(item => item.name === name),
      1
    );
  },
};

export default {
  namespaced: true,
  state,
  mutations,
}