const state = {
    id: null,
    images: null,
    page: null,
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
}

export default {
    namespaced: true,
    state,
    mutations,
}