import Vue from 'vue';
import Vuex from 'vuex';

// import modules
import darkMode from './modules/darkMode';
import landingBanner from './modules/landingBanner';
import rank from './modules/rank';
import search from './modules/search';
import userSearch from './modules/userSearch';
import imageCache from './modules/imageCache';
import artist from './modules/artist';
import download from './modules/download';
import pic from './modules/pic';
import loadController from './modules/loadController';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    darkMode,
    landingBanner,
    rank,
    search,
    userSearch,
    imageCache,
    artist,
    download,
    pic,
    loadController,
  },
});
