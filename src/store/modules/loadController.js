import bus from '@/util/bus';

/* eslint-disable no-param-reassign */
const LOAD_FAILED_LIMIT = 10;

export default {
  namespaced: true,
  state: {
    imageFailedRecord: {},
    disabledHosts: [],
  },
  mutations: {
    setImageLoadFailed(state, host) {
      if (!state.imageFailedRecord[host]) {
        state.imageFailedRecord[host] = 1;
      } else {
        state.imageFailedRecord[host] += 1;
      }
      if (!state.imageFailedRecord[host] > LOAD_FAILED_LIMIT) {
        return;
      }
      // over limit, remove from proxy host list
      state.disabledHosts.push(host);
      try {
        const storedDisabledProxy = window.localStorage.getItem('pixiviz-proxy-disabled');
        const disabledHosts = [];
        if (storedDisabledProxy) {
          disabledHosts.push(...JSON.parse(storedDisabledProxy).hosts);
        }
        disabledHosts.push(host);
        window.localStorage.setItem(
          'pixiviz-proxy-disabled',
          JSON.stringify({
            time: new Date().valueOf(),
            hosts: disabledHosts,
          }),
        );
        bus.$emit('update-disabled-proxy-hosts', [host]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    },
  },
};
