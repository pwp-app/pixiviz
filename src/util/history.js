import idb from './idb';
import { filterImages } from './filter';

const USER_HISTORY_SIZE_LIMIT = 100;
const USER_HISTORY_DB_KEY = 'user-history';
const USER_HISTORY_WRITE_DELAY = 500;

const imageMap = {};

let userHistory = null;
let writeTimeout = null;

export const getUserHistory = async () => {
  if (userHistory) {
    return userHistory;
  }
  const stored = JSON.parse(await idb.get(USER_HISTORY_DB_KEY));
  if (!stored || !Array.isArray(stored)) {
    return null;
  }
  try {
    // eslint-disable-next-line require-atomic-updates
    userHistory = filterImages(stored, false);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to get user history.', err);
    return null;
  }
  userHistory.forEach((image) => {
    imageMap[image.id] = true;
  });
  return userHistory;
};

export const addUserHistory = async (image) => {
  if (!userHistory || !Array.isArray(userHistory)) {
    // eslint-disable-next-line require-atomic-updates
    userHistory = (await getUserHistory()) || [];
  }
  if (writeTimeout) {
    clearTimeout(writeTimeout);
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
  userHistory.unshift(image);
  if (userHistory.length > USER_HISTORY_SIZE_LIMIT) {
    const toRemove = userHistory.pop();
    delete imageMap[toRemove.id];
  }
  writeTimeout = setTimeout(async () => {
    // write to idb
    await idb.set(USER_HISTORY_DB_KEY, JSON.stringify(userHistory));
  }, USER_HISTORY_WRITE_DELAY);
};

export const getHistoryTop = () => {
  if (!userHistory || userHistory.length < 1) {
    return null;
  }
  return userHistory[0];
};

export const clearHistory = async () => {
  userHistory = null;
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }
  await idb.set(USER_HISTORY_DB_KEY, JSON.stringify([]));
};
