export const weightedRandom = (spec) => {
  let key;
  let sum = 0;
  let idx = 0;
  const r = Math.random();
  // eslint-disable-next-line guard-for-in
  for (key in spec) {
    sum += spec[key];
    if (r <= sum) {
      return [key, idx];
    }
    idx += 1;
  }
  return [key, idx];
};
