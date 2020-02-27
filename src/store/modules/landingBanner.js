const state = {
    expanded: false
}

const mutations = {
    setExpanded (state, expanded) {
        state.expanded = expanded;
    }
}

export default {
    namespaced: true,
    state,
    mutations
}