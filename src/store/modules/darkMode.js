/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import { updateThemeColor } from '@/util/darkMode';

const state = {
  enabled: window.pixiviz.darkMode,
};

const mutations = {
  setEnabled(state, value) {
    state.enabled = value;
    window.pixiviz.darkEnabled = value;
    window.localStorage.setItem('enable-dark', value);
    if (value) {
      !document.documentElement.classList.contains('dark') &&
        document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.contains('dark') &&
        document.documentElement.classList.remove('dark');
    }
    updateThemeColor();
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
