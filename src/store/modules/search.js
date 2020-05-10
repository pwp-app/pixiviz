const state = {
    keyword: null,
    images: null,
    page: null,
    suggestions: null
}

const mutations = {
    setKeyword(state, keyword) {
        state.keyword = keyword;
    },
    setImages(state, images) {
        state.images = images;
    },
    setPage(state, page) {
        state.page = page;
    },
    setSuggestions(state, suggestions) {
        state.suggestions = suggestions;
    }
}

export default {
    namespaced: true,
    state,
    mutations
}