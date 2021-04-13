/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const state = {
  list: [],
};

const mutations = {
  addItem(state, item) {
    state.list.push(item);
  },
  removeItem(state, name) {
    state.list.splice(
      state.list.findIndex((item) => item.name === name),
      1,
    );
  },
};

const getters = {
  hasName: (state) => (name) => {
    return state.list.findIndex((item) => item.name === name) > -1;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  getters,
};
