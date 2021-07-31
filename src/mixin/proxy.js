export default {
  methods: {
    getImageProxyHost() {
      const hosts = this.$config.image_proxy_host;
      if (typeof hosts !== 'object') {
        return hosts;
      }
      return Object.keys(hosts)[0];
    },
  },
};
