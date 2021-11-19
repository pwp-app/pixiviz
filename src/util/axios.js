import qs from 'qs';
import axios from 'axios';

// Set up axios
axios.defaults.baseURL = '';
axios.defaults.withCredentials = false;
axios.defaults.timeout = 10000;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = [
  function(data) {
    return qs.stringify(data, {
      arrayFormat: 'brackets',
    });
  },
];

const fixConfig = (axiosIns, config) => {
  if (axiosIns.defaults.agent === config.agent) {
    // eslint-disable-next-line no-param-reassign
    delete config.agent;
  }
  if (axiosIns.defaults.httpAgent === config.httpAgent) {
    // eslint-disable-next-line no-param-reassign
    delete config.httpAgent;
  }
  if (axiosIns.defaults.httpsAgent === config.httpsAgent) {
    // eslint-disable-next-line no-param-reassign
    delete config.httpsAgent;
  }
  return config;
};

export const wrapAxios = (axiosIns, pixivizConf) => {
  axiosIns.interceptors.response.use(
    (res) => {
      if (res.config.isRetry && res.config.url.includes('/v1')) {
        const prefix = `${res.config.url.split('/v1')[0]}/v1`;
        window.localStorage.setItem('pixiviz-api-prefix', prefix);
      }
      return res;
    },
    (err) => {
      const reqConfig = err.config;
      if (reqConfig.isRetry) {
        return Promise.reject(err);
      }
      const { url } = reqConfig;
      if (!url.includes('/v1')) {
        return Promise.reject(err);
      }
      const splitted = url.split('/v1');
      const prefix = `${splitted[0]}/v1`;
      const reqPath = splitted[1];
      const { api_prefix_list: prefixList } = pixivizConf;
      if (!prefixList.includes(prefix)) {
        return Promise.reject(err);
      }
      const filteredPrefixList = prefixList.filter((item) => item !== prefix);
      // eslint-disable-next-line no-param-reassign
      pixivizConf.api_prefix_list = filteredPrefixList;
      const nextPrefix = filteredPrefixList[Date.now() % filteredPrefixList.length];
      return axios({
        ...fixConfig(axiosIns, reqConfig),
        url: `${nextPrefix}${reqPath}`,
        isRetry: true,
      });
    },
  );
  return axiosIns;
};

export default axios;
