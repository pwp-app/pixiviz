import idb from './idb';
import { filterImages } from './filter';

const USER_HISTORY_SIZE_LIMIT = 100;
const USER_HISTORY_DB_KEY = 'user-history';
const USER_HISTORY_WRITE_DELAY = 500;

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
};

export const addUserHistory = (image) => {
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }
  writeTimeout = setTimeout(async () => {
    userHistory.push(image);
    if (userHistory.length > USER_HISTORY_SIZE_LIMIT) {
      userHistory.shift();
    }
    // write to idb
    await idb.set(USER_HISTORY_DB_KEY, JSON.stringify(userHistory));
  }, USER_HISTORY_WRITE_DELAY);
};
