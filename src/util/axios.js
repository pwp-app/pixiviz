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

export default axios;
