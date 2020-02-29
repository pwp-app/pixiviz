const state = {
    images: null,
    page: null,
    mode: null,
    date: null,
    reset: false
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
    },
    setReset (state, value) {
        state.reset = value;
    }
}

export default {
    namespaced: true,
    state,
    mutations
}