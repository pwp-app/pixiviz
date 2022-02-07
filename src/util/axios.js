import qs from 'qs';
import axios from 'axios';

const instance = axios.create({
  baseURL: '',
  withCredentials: false,
  timeout: 10 * 1000,
  headers: {
    post: {
      'Content-Type': 'appliation/x-www-form-urlencoded',
    },
    get: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
  transformRequest: [
    function(data) {
      return qs.stringify(data, {
        arrayFormat: 'brackets',
      });
    },
  ],
});

const fixConfig = (axiosIns, config) => {
  ['agent', 'httpAgent', 'httpsAgent'].forEach((key) => {
    if (axiosIns.defaults[key] === config[key]) {
      // eslint-disable-next-line no-param-reassign
      delete config[key];
    }
  });
  return config;
};

export const wrapAxios = (axiosIns, pixivizConf) => {
  axiosIns.interceptors.response.use(
    (res) => {
      if (res.config.retryTimes && res.config.url.includes('/v1')) {
        const prefix = `${res.config.url.split('/v1')[0]}/v1`;
        window.localStorage.setItem('pixiviz-api-prefix', prefix);
      }
      return res;
    },
    (err) => {
      const reqConfig = err.config;
      if (reqConfig.maxRetryTimes === 0) {
        return Promise.reject(err);
      }
      if (reqConfig.retryTimes >= (reqConfig.maxRetryTimes || 2)) {
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
        retryTimes: reqConfig.retryTimes ? reqConfig.retryTimes + 1 : 1,
      });
    },
  );
  return axiosIns;
};

export default instance;
