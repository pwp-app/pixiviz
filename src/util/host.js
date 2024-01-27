export const getMaxWeightedHost = (hosts) => {
  const weightHostMap = {};
  const weights = [];
  const keys = Object.keys(hosts);
  keys.forEach((host) => {
    const weight = hosts[host];
    weights.push(weight);
    if (!weightHostMap[weight]) {
      weightHostMap[weight] = [];
    }
    weightHostMap[weight].push(host);
  });
  const maxWeight = Math.max(...weights);
  return weightHostMap[maxWeight][0] || hosts[keys[0]];
};

export const checkTrustHost = (config) => {
  const trustHost = config?.trust_host;
  if (!trustHost || !Array.isArray(trustHost) || typeof trustHost !== 'string') {
    return true;
  }
  if (
    (Array.isArray(trustHost) && !trustHost.includes(window.location.host)) ||
    (typeof trustHost === 'string' && window.location.host !== trustHost)
  ) {
    return false;
  }
  return true;
};
