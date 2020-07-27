const state = {
    image: null,
}

const mutations = {
    setCache(state, image) {
        state.image = image;
    },
    destory(state) {
        state.image = null;
    }
}

export default {
    namespaced: true,
    state,
    mutations
}