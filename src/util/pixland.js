/* eslint-disable no-console */
import cloneDeep from 'lodash-es/cloneDeep';
import Pixland from 'pixland';
import bus from './bus';
import { clearHistory, getUserHistory, mergeUserHistory } from './history';

const pixlandIns = new Pixland({
  fileHost: 'pixland.pwp.link',
  apiHost: 'api-pixland.pwp.app',
});

const LAST_SYNC_KEY = 'pixland-last-sync';

const lastSyncTime = parseInt(window.localStorage.getItem(LAST_SYNC_KEY), 10) || -1;

const checkHistorySync = async (remoteHistory, picData) => {
  if (!remoteHistory || !picData) {
    return;
  }
  console.debug('[Pixland] Check history sync...');
  const localHistory = await getUserHistory();
  // History items which should be uploaded to remote
  const readyForRemote = localHistory.filter(item => item._ctime >= lastSyncTime);
  // History items which not in the local storage
  const notInLocal = remoteHistory.filter(item => item.t >= lastSyncTime);
  const readyForLocal = notInLocal.map((item) => {
    const picId = item.i;
    const picItem = picData[item];
    return picItem ? { ...picItem, id: picId, _ctime: item.t } : null;
  }).filter((item) => !!item);
  console.debug('[Pixland] History check ready.', readyForLocal, readyForRemote);
  // Merge remote history to local
  mergeUserHistory(readyForLocal);
  // Merge local part to remote data
  const remoteHistoryPicIds = remoteHistory.map((item) => item.i);
  const finalRemoteHistory = cloneDeep(remoteHistory);
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
  console.debug('[Pixland] Check history sync res', finalRemoteHistory, newPicData);
  return [finalRemoteHistory, newPicData];
}

export const syncData = async () => {
  if (!pixlandIns) {
    return;
  }
  console.debug('[Pixland] Start sync data...');
  // #1: Get user data from pixland
  const userData = await pixlandIns.getUserData();
  console.debug('[Pixland] User data gotten.', userData);
  // #2: Check history sync
  const historyRes = await checkHistorySync(userData.history, userData.picData);
  // #3: Build new user data
  userData.history = historyRes[0];
  userData.picData = historyRes[1];
  // #4: Save to remote
  console.debug('[Pixland] Start uploading...', userData);
  await pixlandIns.uploadUserData(userData);
  window.localStorage.setItem(LAST_SYNC_KEY, Math.floor(Date.now() / 1e3));
};

export const logout = () => {
  if (!pixlandIns) {
    return;
  }
  pixlandIns.logout();
  // after logout, clear stored user data in local
  clearHistory();
  window.localStorage.removeItem(LAST_SYNC_KEY);
}

bus.$on('pixland-start-sync', () => {
  if (!pixlandIns.isLogin()) {
    return;
  }
  syncData();
});

export default pixlandIns;
