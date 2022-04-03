import idb from './idb';
import bus from './bus';
import { filterImages } from './filter';

const USER_HISTORY_SIZE_LIMIT = 200;
const USER_HISTORY_DB_KEY = 'user-history';

let broadCastChannel;
if (window.BroadcastChannel) {
  broadCastChannel = new BroadcastChannel('pixiviz-history');
}

let imageMap = {};

let userHistory = null;

const notifyUpdated = () => {
  bus.$emit('history-updated');
  broadCastChannel?.postMessage('history-updated');
};

export const getUserHistory = async ({ bypass = false } = {}) => {
  if (userHistory && !bypass) {
    return userHistory;
  }
  const stored = JSON.parse(await idb.get(USER_HISTORY_DB_KEY));
  if (!Array.isArray(stored)) {
    return null;
  }
  try {
    // eslint-disable-next-line require-atomic-updates
    userHistory = filterImages(stored, false).map((item) => {
      if (!item._ctime) {
        return {
          ...item,
          _ctime: Math.floor(Date.now() / 1e3), // set current time as ctime for sync usage
        };
      }
      return item;
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to get user history.', err);
    return null;
  }
  imageMap = {}; // clear image map
  userHistory.forEach((image) => {
    imageMap[image.id] = true;
  });
  return userHistory.sort((a, b) => b._ctime - a._ctime);
};

export const addUserHistory = async (image) => {
  if (!Array.isArray(userHistory)) {
    // eslint-disable-next-line require-atomic-updates
    userHistory = (await getUserHistory()) || [];
  }
  // check existed
  if (imageMap[image.id]) {
    const idx = userHistory.findIndex((item) => item.id === image.id);
    if (idx >= 0) {
      userHistory.splice(idx, 1);
    }
  } else {
    imageMap[image.id] = true;
  }
  userHistory.unshift({
    ...image,
    _ctime: Math.floor(Date.now() / 1e3),
  });
  notifyUpdated();
  if (userHistory.length > USER_HISTORY_SIZE_LIMIT) {
    const toRemove = userHistory.pop();
    delete imageMap[toRemove.id];
  }
  saveToDb({ emitPixlandEvent: true });
};

export const setUserHistory = async (images) => {
  userHistory = images;
  imageMap = {};
  userHistory.forEach((image) => {
    imageMap[image.id] = true;
  });
  notifyUpdated();
  saveToDb();
};

export const mergeUserHistory = async (images) => {
  if (!Array.isArray(userHistory)) {
    // eslint-disable-next-line require-atomic-updates
    userHistory = (await getUserHistory()) || [];
  }
  images.forEach((image) => {
    // check if exists
    if (imageMap[image.id]) {
      const idx = userHistory.findIndex((item) => item.id === image.id);
      const existed = userHistory[idx];
      userHistory[idx] = {
        ...existed,
        _ctime: image._ctime,
      };
    } else {
      imageMap[image.id] = true;
      userHistory.unshift(image);
    }
  });
  userHistory.sort((a, b) => b._ctime - a._ctime);
  saveToDb();
};

export const removeHistoryBefore = async (time) => {
  if (!userHistory) {
    await getUserHistory();
  }
  userHistory = userHistory.filter((item) => item._ctime > time);
  saveToDb();
};

export const saveToDb = async ({ emitPixlandEvent = false } = {}) => {
  await idb.set(USER_HISTORY_DB_KEY, JSON.stringify(userHistory));
  if (emitPixlandEvent) {
    bus.$emit('pixland-start-sync');
  }
};

export const getHistoryTop = () => {
  if (!userHistory || userHistory.length < 1) {
    return null;
  }
  return userHistory[0];
};

export const clearHistory = async () => {
  userHistory = null;
  imageMap = {};
  setUserHistory([]);
};

export { USER_HISTORY_SIZE_LIMIT };
