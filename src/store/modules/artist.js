const state = {
  id: null,
  images: {},
	page: {},
	map: {},
}

const mutations = {
  setId(state, id) {
    state.id = id;
  },
  setImages(state, data) {
    state.images[data.id] = data.images;
  },
  setPage(state, data) {
    state.page[data.id] = data.page;
  },
  setMapItem(state, info) {
    state.map[info.id] = info.content;
  }
}

export default {
  namespaced: true,
  state,
  mutations,
}