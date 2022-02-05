/* eslint-disable no-console */
import { sha256 } from 'hash-wasm';
import cloneDeep from 'lodash-es/cloneDeep';
import Pixland from 'pixland';
import bus from './bus';
import { clearHistory, getUserHistory, mergeUserHistory, removeHistoryBefore, USER_HISTORY_SIZE_LIMIT } from './history';

const pixlandIns = new Pixland({
  fileHost: 'pixland.pwp.link',
  apiHost: 'api-pixland.pwp.app',
});

const LAST_SYNC_KEY = 'pixland-last-sync';
const SYNC_TIME_MIN_SPAN = 3; // limit qps

let lastSyncTime = parseInt(window.localStorage.getItem(LAST_SYNC_KEY), 10) || -1;
let syncTimeout;

const checkHistorySync = async (userData) => {
  const { history: remoteHistory, collection, picData, lastHistoryClear } = userData;
  if (!remoteHistory || !picData) {
    return;
  }
  console.debug('[Pixland] Last sync time', lastSyncTime, new Date(lastSyncTime * 1e3).toString());
  console.debug('[Pixland] Check history sync...');
  const localHistory = await getUserHistory();
  // History items which should be uploaded to remote
  const lastClearTime = lastHistoryClear || -1;
  const readyForRemote = localHistory.filter((item) => item._ctime >= lastSyncTime && item._ctime > lastClearTime);
  // History items which not in the local storage
  const notInLocal = remoteHistory.filter((item) => item.t >= lastSyncTime && item.t >= lastClearTime);
  const readyForLocal = notInLocal
    .map((item) => {
      const picId = item.i;
      const picItem = picData[picId];
      return picItem ? { ...picItem, id: picId, _ctime: item.t } : null;
    })
    .filter((item) => !!item);
  console.debug(
    '[Pixland] History check ready.',
    'Ready for local',
    readyForLocal,
    'Ready for remote',
    readyForRemote,
  );
  // Merge remote history to local
  mergeUserHistory(readyForLocal);
  // Merge local part to remote data
  const remoteHistoryPicIds = remoteHistory.map((item) => item.i);
  let finalRemoteHistory = cloneDeep(remoteHistory);
  const newPicData = cloneDeep(picData);
  readyForRemote.forEach((item) => {
    if (remoteHistoryPicIds.includes(item.id)) {
      const idx = finalRemoteHistory.findIndex((pic) => pic.i === item.id);
      if (idx >= 0) {
        finalRemoteHistory[idx].t = Math.floor(Date.now() / 1e3);
      }
      return;
    }
    // not exists in remote history
    finalRemoteHistory.unshift({
      i: item.id,
      t: Math.floor(Date.now() / 1e3),
    });
    if (!newPicData[item.id]) {
      newPicData[item.id] = item;
    }
  });
  finalRemoteHistory = finalRemoteHistory.sort((a, b) => a.t - b.t);
  // check remote history size limit
  if (finalRemoteHistory.length > USER_HISTORY_SIZE_LIMIT) {
    let overSize = finalRemoteHistory.length - USER_HISTORY_SIZE_LIMIT;
    const collectionIdMap = {};
    if (overSize) {
      collection.forEach((item) => {
        if (!item?.i) {
          return;
        }
        collectionIdMap[item.i] = true;
      });
    }
    while (overSize) {
      // pop oldest from remote history
      const popped = finalRemoteHistory.pop();
      const { i: poppedPicId } = popped;
      if (newPicData[poppedPicId] && !collectionIdMap[poppedPicId]) {
        delete newPicData[poppedPicId];
      }
      overSize--;
    }
  }
  if (lastClearTime > 0) {
    await removeHistoryBefore(lastClearTime);
  }
  console.debug('[Pixland] Check history sync res', finalRemoteHistory, newPicData);
  return [finalRemoteHistory, newPicData];
};

export const clearRemoteHistory = async () => {
  if (!pixlandIns) {
    return;
  }
  console.debug('[Pixland] Starting to clear remote history...');
  const userData = await pixlandIns.getUserData();
  if (!Array.isArray(userData.history)) {
    return;
  }
  const collectionIdMap = {};
  userData.collection.forEach((item) => {
    collectionIdMap[item.i] = true;
  });
  userData.history.forEach((item) => {
    const picId = item.i;
    if (!userData.picData[picId]) {
      return;
    }
    if (collectionIdMap[picId]) {
      return;
    }
    delete userData.picData[picId];
  });
  userData.history = [];
  userData.lastHistoryClear = Math.floor(Date.now() / 1e3);
  console.debug('[Pixland] Start uploading...', userData);
  await pixlandIns.uploadUserData(userData);
  lastSyncTime = Math.floor(Date.now() / 1e3);
  window.localStorage.setItem(LAST_SYNC_KEY, lastSyncTime);
}

export const syncData = async ({ immediate = false } = {}) => {
  if (!pixlandIns) {
    return;
  }
  const now = Math.floor(Date.now() / 1e3);
  const minSpan = window.pixiviz?.config?.syncMinSpan || SYNC_TIME_MIN_SPAN;
  if ((now - lastSyncTime < minSpan || syncTimeout) && !immediate) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      syncTimeout = null;
      syncData();
    }, SYNC_TIME_MIN_SPAN * 1000);
    console.debug('[Pixland] Sync delay...', now - lastSyncTime);
    return;
  }
  console.debug('[Pixland] Start sync data...');
  // #1: Get user data from pixland
  const userData = await pixlandIns.getUserData();
  const hash = await sha256(JSON.stringify(userData));
  console.debug('[Pixland] User data gotten.', userData);
  // #2: Check history sync
  const historyRes = await checkHistorySync(userData);
  // #3: Build new user data
  userData.history = historyRes[0];
  userData.picData = historyRes[1];
  // #4: Hash compare
  const newHash = await sha256(JSON.stringify(userData));
  if (newHash === hash) {
    // No changes
    console.debug('[Pixland] Hash same, abort uploading...', hash, newHash);
    return;
  }
  // #5: Save to remote
  console.debug('[Pixland] Start uploading...', userData);
  await pixlandIns.uploadUserData(userData);
  // eslint-disable-next-line require-atomic-updates
  lastSyncTime = Math.floor(Date.now() / 1e3);
  window.localStorage.setItem(LAST_SYNC_KEY, lastSyncTime);
};

export const logout = () => {
  if (!pixlandIns) {
    return;
  }
  pixlandIns.logout();
  // after logout, clear stored user data in local
  clearHistory();
  lastSyncTime = -1;
  window.localStorage.removeItem(LAST_SYNC_KEY);
};

bus.$on('pixland-start-sync', () => {
  if (!pixlandIns.isLogin()) {
    return;
  }
  syncData();
});

window.addEventListener('beforeunload', () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    // try sync data last time
    syncData({ immediate: true });
  }
});

export default pixlandIns;
