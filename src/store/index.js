import Vue from 'vue'
import Vuex from 'vuex'

// import modules
import landingBanner from './modules/landingBanner';

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        landingBanner
    }
})