const state = {
    images: null,
    page: null,
    mode: null,
    date: null
}

const mutations = {
    setImages (state, images) {
        state.images = images;
    },
    setPage (state, page) {
        state.page = page;
    },
    setMode (state, mode) {
        state.mode = mode;
    },
    setDate (state, date) {
        state.date = date;
    }
}

export default {
    namespaced: true,
    state,
    mutations
}