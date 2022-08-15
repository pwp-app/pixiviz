const storeKey = 'pixiviz-remote-config';

export const clearCachedConfig = () => {
  window.localStorage.removeItem(storeKey);
};

export const setCacheConfig = (config) => {
  window.localStorage.setItem(
    storeKey,
    JSON.stringify({
      value: config,
      time: Date.now(),
    }),
  );
};

export const getCachedConfig = () => {
  const cached = window.localStorage.getItem(storeKey);
  if (!cached) {
    return null;
  }
  try {
    const parsed = JSON.parse(cached);
    // max cache time: 3h
    if (Date.now() - parsed.time > 3600 * 1000 * 3) {
      clearCachedConfig();
      // eslint-disable-next-line no-console
      console.debug('[Config] Cached config outdated.');
      return null;
    }
    const ret = parsed?.value || null;
    // eslint-disable-next-line no-console
    console.debug('[Config] Cached config', ret);
    return ret;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return null;
  }
};

export const waitForRemoteConfig = (maxSecs) => {
  let sec = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.pixiviz?.config?.IS_REMOTE_CONFIG) {
        clearInterval(interval);
        resolve();
      }
      sec += 0.1;
      if (sec >= maxSecs) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};
