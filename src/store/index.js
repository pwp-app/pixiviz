import Vue from 'vue'
import Vuex from 'vuex'

// import modules
import landingBanner from './modules/landingBanner';
import rank from './modules/rank';
import search from './modules/search';
import imageCache from './modules/imageCache';
import artist from './modules/artist';
import download from './modules/download';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    landingBanner,
    rank,
    search,
    imageCache,
		artist,
		download,
  },
});