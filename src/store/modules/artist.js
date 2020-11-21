const state = {
  id: null,
  images: null,
	page: null,
	map: {},
}

const mutations = {
  setId(state, id) {
    state.id = id;
  },
  setImages(state, images) {
    state.images = images;
  },
  setPage(state, page) {
    state.page = page;
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