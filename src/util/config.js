const storeKey = 'pixiviz-remote-config';

export const getCachedConfig = () => {
  const cached = window.localStorage.getItem(storeKey);
  if (!cached) {
    return null;
  }
  try {
    return JSON.parse(cached);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return null;
  }
};

export const setCachedConfig = (config) => {
  window.localStorage.setItem(storeKey, JSON.stringify(config));
};
