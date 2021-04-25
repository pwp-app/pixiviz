export const getMaxWeightedHost = (hosts) => {
  const weightHostMap = {};
  const weights = [];
  Object.keys(hosts).forEach((host) => {
    const weight = hosts[host];
    weights.push(weight);
    if (!weightHostMap[weight]) {
      weightHostMap[weight] = [];
    }
    weightHostMap[weight].push(host);
  });
  const maxWeight = Math.max(...weights);
  return weightHostMap[maxWeight][0];
};
