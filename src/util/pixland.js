/* eslint-disable no-console */
import { sha256 } from 'hash-wasm';
import cloneDeep from 'lodash-es/cloneDeep';
import Pixland from 'pixland';
import bus from './bus';
import { getUserCollection, setUserCollection } from './collection';
import {
  clearHistory,
  getUserHistory,
  mergeUserHistory,
  removeHistoryBefore,
  USER_HISTORY_SIZE_LIMIT,
} from './history';
import { checkTrustHost } from './host';

// bind events before initialize pixland

const checkPixlandGlobal = () => {
  if (window.pixiviz) {
    window.pixiviz.pixland = {};
  } else {
    window.pixiviz = {};
    window.pixiviz.pixland = {};
  }
};

window.addEventListener('pixland_user-login', () => {
  checkPixlandGlobal();
  window.pixiviz.pixland.isLogin = true;
});

window.addEventListener('pixland_user-logout', () => {
  checkPixlandGlobal();
  window.pixiviz.pixland.isLogin = false;
});

const pixlandIns = new Pixland({
  fileHost: 'worker.pixland.pwp.app',
});

const LAST_SYNC_KEY = 'pixland-last-sync';
const SYNC_TIME_MIN_SPAN = 10; // limit qps

let lastSyncTime = parseInt(window.localStorage.getItem(LAST_SYNC_KEY), 10) || -1;
let syncTimeout;
let processingSync = false;

/**
 * Checking whether user history should be synchronized to the server
 * @param {*} userData User data fetched from remote server
 */
const checkHistorySync = async (userData) => {
  const { history: remoteHistory, collection, lastHistoryClear } = userData;
  let { picData } = userData;
  // Init pic data for empty remote data
  picData = picData || {};
  // Get history data from local
  console.debug('[Pixland] Check history sync...');
  const localHistory = (await getUserHistory()) || [];
  // History items which should be uploaded to remote
  const lastClearTime = lastHistoryClear || -1;
  const readyForRemote = (localHistory || []).filter(
    (item) => item._ctime >= lastSyncTime && item._ctime >= lastClearTime,
  );
  // History items which not in the local storage
  const notInLocal = (remoteHistory || []).filter(
    (item) => item.t >= lastSyncTime && item.t >= lastClearTime,
  );
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
        newPicData[item.id] = item;
      }
      return;
    }
    // not exists in remote history
    finalRemoteHistory.unshift({
      i: item.id,
      // use the latest time as the create time, otherwise it will not be synced to other clients
      t: Math.floor(Date.now() / 1e3),
    });
    // set new pic data to pic dataset
    newPicData[item.id] = item;
  });
  finalRemoteHistory = finalRemoteHistory.sort((a, b) => b.t - a.t);
  // check remote history size limit
  if (finalRemoteHistory.length > USER_HISTORY_SIZE_LIMIT) {
    let overSize = finalRemoteHistory.length - USER_HISTORY_SIZE_LIMIT;
    // get id map of collection to remove certain pic data
    let collectionIdMap = {};
    if (overSize) {
      collectionIdMap = getPicIdMapByCollection(collection);
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
  // clear useless data in local
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
  // set up pic data
  const collectionIdMap = getPicIdMapByCollection(userData.collection);
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
  // set up final return for uploading
  userData.history = [];
  userData.lastHistoryClear = Math.floor(Date.now() / 1e3);
  console.debug('[Pixland] Start uploading...', userData);
  // upload new data
  await pixlandIns.uploadUserData(userData);
  // cache last sync time
  lastSyncTime = Math.floor(Date.now() / 1e3);
  window.localStorage.setItem(LAST_SYNC_KEY, lastSyncTime);
};

// generate id map which flags if a pic existed
const getPicIdMapByCollection = (collection) => {
  const idMap = {};
  const indexMap = {};
  Object.keys(collection).forEach((categoryName) => {
    const category = collection[categoryName];
    category.forEach((pic, index) => {
      const picId = pic.id || pic.i;
      if (!idMap[picId]) {
        idMap[picId] = true;
      }
      if (!indexMap[categoryName]) {
        indexMap[categoryName] = {};
      }
      indexMap[categoryName][picId] = index;
    });
  });
  return [idMap, indexMap];
};

const getPicIdMapByHistory = (history) => {
  const idMap = {};
  history.forEach((pic) => {
    if (!idMap[pic.id]) {
      idMap[pic.id] = true;
    }
  });
  return idMap;
};

const checkCollectionSync = async (userData) => {
  const { history } = userData;
  let { collection: remoteCollection, picData } = userData;
  // init vars
  remoteCollection = remoteCollection || {};
  picData = picData || {};
  if (
    typeof remoteCollection !== 'object' ||
    (typeof remoteCollection === 'object' && !Object.keys(remoteCollection).length)
  ) {
    remoteCollection = {};
  }
  console.debug('[pixland]', 'remote collection ->', remoteCollection);
  // get user collection data from local (here we fetched the data in the memory, because some changes might not be written to the idb)
  let localCollection = (await getUserCollection()) || {};
  if (
    typeof localCollection !== 'object' ||
    (typeof localCollection === 'object' && !Object.keys(localCollection).length)
  ) {
    localCollection = {};
  }
  console.debug('[pixland]', 'local collection ->', localCollection);
  // generate cloned copy for next operations
  const newPicData = cloneDeep(picData);
  // no remote collection data, but has local, upload all
  if (!Object.keys(remoteCollection).length && Object.keys(localCollection).length) {
    Object.keys(localCollection).forEach((categoryName) => {
      const category = localCollection[categoryName];
      category.forEach((pic) => {
        if (!newPicData[pic.id]) {
          newPicData[pic.id] = pic;
        }
      });
    });
    const readyForRemote = {};
    Object.keys(localCollection).forEach((categoryName) => {
      readyForRemote[categoryName] = localCollection[categoryName].map((pic) => {
        newPicData[pic.id] = pic;
        return {
          i: pic.id,
          t: Math.floor(Date.now() / 1e3),
          o: pic._ctime || Math.floor(Date.now() / 1e3),
        };
      });
    });
    // for data saving, data structure of remote collection is quite different from the local
    console.debug(
      '[pixland] write all local collection data to remote.',
      readyForRemote,
      newPicData,
    );
    return [readyForRemote, newPicData];
  }
  // no local collection data, but has remote, download all
  if (!Object.keys(localCollection).length && Object.keys(remoteCollection).length) {
    // just add all remote collection data to the local
    const readyForLocal = {};
    Object.keys(remoteCollection).forEach((categoryName) => {
      const category = remoteCollection[categoryName];
      readyForLocal[categoryName] = category.map((item) => ({
        ...picData[item.i],
        id: item.i,
        _ctime: item.t,
        _otime: item.o,
      }));
    });
    setUserCollection(readyForLocal);
    console.debug('[pixland] write all local collection data to local.', readyForLocal, newPicData);
    return [remoteCollection, picData];
  }
  // get id map of remote collection data
  const [localPicIdMap, localPicIndexMap] = getPicIdMapByCollection(localCollection);
  const [remotePicIdMap, remotePicIndexMap] = getPicIdMapByCollection(remoteCollection);
  console.debug(localPicIdMap, remotePicIdMap);
  const historyPicIdMap = getPicIdMapByHistory(history);
  // data which should be merged / deleted to local
  const shouldBeMergedToLocal = {};
  const shouldBeRemovedFromLocal = {};
  // data which should be merged / deleted to remote
  const shouldBeMergedToRemote = {};
  const shouldBeRemovedFromRemote = {};
  // generate shouldBeMergedToRemote and shouldBeDeleteFromLocal
  Object.keys(localCollection).forEach((categoryName) => {
    const category = localCollection[categoryName];
    if (!shouldBeRemovedFromLocal[categoryName]) {
      shouldBeRemovedFromLocal[categoryName] = [];
    }
    if (!shouldBeMergedToRemote[categoryName]) {
      shouldBeMergedToRemote[categoryName] = [];
    }
    category.forEach((pic) => {
      if (pic._ctime >= lastSyncTime && !remotePicIdMap[pic.id]) {
        // if pic present in local but not in remote,
        // and its create time after last sync time,
        // it should be added to remote
        shouldBeMergedToRemote[categoryName].push(pic);
      } else if (pic._ctime < lastSyncTime && !remotePicIdMap[pic.id]) {
        // if pic present in local but not in remote,
        // and its create time before the last sync time,
        // it should be removed from local
        shouldBeRemovedFromLocal[categoryName].push(pic);
      }
    });
  });
  // generate shouldBeMergedToLocal and shouldBeDeleteFromRemote
  Object.keys(remoteCollection).forEach((categoryName) => {
    const category = remoteCollection[categoryName];
    if (!shouldBeMergedToLocal[categoryName]) {
      shouldBeMergedToLocal[categoryName] = [];
    }
    if (!shouldBeRemovedFromRemote[categoryName]) {
      shouldBeRemovedFromRemote[categoryName] = [];
    }
    category.forEach((pic) => {
      if (pic.t >= lastSyncTime && !localPicIdMap[pic.i]) {
        // if pic present in remote and not in local when its create time after the last sync time
        // it should be added to local
        shouldBeMergedToLocal[categoryName].push(pic);
      } else if (pic.t < lastSyncTime && !localPicIdMap[pic.i]) {
        // if pic present in remote and not in local when its create time before the last sync time
        // it should be removed frome the remote
        shouldBeRemovedFromRemote[categoryName].push(pic);
      }
    });
  });
  console.debug('[pixland]', 'collection that should be merged to local', shouldBeMergedToLocal);
  console.debug(
    '[pixland]',
    'collection that should be removed from local',
    shouldBeRemovedFromLocal,
  );
  console.debug('[pixland]', 'collection that should be merged to remote', shouldBeMergedToRemote);
  console.debug(
    '[pixland]',
    'collection that should be removed from remote',
    shouldBeRemovedFromRemote,
  );
  // after scan, merge and remove the data for both sides
  // create a copy for uploading and local saving
  const readyForLocal = cloneDeep(localCollection);
  const readyForRemote = cloneDeep(remoteCollection);
  // remove what should be removed for local
  Object.keys(shouldBeRemovedFromLocal).forEach((categoryName) => {
    const category = shouldBeRemovedFromLocal[categoryName];
    if (Array.isArray(category) && category.length) {
      category.forEach((pic) => {
        const index = localPicIndexMap[categoryName]?.[pic.id];
        if (typeof index === 'undefined') {
          // prevent crashing
          return;
        }
        // if using splice here, the index map will be incorrect
        readyForLocal[categoryName][index] = null;
      });
      // at last, filter the null items
      readyForLocal[categoryName] = readyForLocal[categoryName].filter((item) => !!item);
    }
  });
  // merge things to local
  Object.keys(shouldBeMergedToLocal).forEach((categoryName) => {
    const category = shouldBeMergedToLocal[categoryName];
    if (Array.isArray(category) && category.length) {
      readyForLocal[categoryName] = readyForLocal[categoryName].concat(
        category.map((item) => ({
          ...picData[item.i],
          id: item.i,
          _ctime: item.t,
          _otime: item.o,
        })),
      );
    }
    // for safe, do a duplicate filter
    const idMap = {};
    readyForLocal[categoryName] = readyForLocal[categoryName].filter((item) => {
      if (!idMap[item.id]) {
        idMap[item.id] = true;
        return true;
      }
      return false;
    });
  });
  console.debug('[pixland]', 'ready for local collection ->', readyForLocal);
  // save things to local
  setUserCollection(readyForLocal);
  // remove things form remote
  Object.keys(shouldBeRemovedFromRemote).forEach((categoryName) => {
    const category = shouldBeRemovedFromRemote[categoryName];
    category.forEach((item) => {
      const index = remotePicIndexMap[categoryName]?.[item.i];
      if (typeof index !== 'undefined') {
        readyForRemote[categoryName][index] = null;
      }
      // check pic data
      if (!historyPicIdMap[item.i]) {
        delete newPicData[item.i];
      }
    });
    readyForRemote[categoryName] = readyForRemote[categoryName].filter((item) => !!item);
  });
  // merge things to remote
  Object.keys(shouldBeMergedToRemote).forEach((categoryName) => {
    const category = shouldBeMergedToRemote[categoryName];
    category.forEach((item) => {
      // item here is the full pic data, it should be transformed into the simplified structure
      newPicData[item.id] = cloneDeep(item);
      const now = Math.floor(Date.now() / 1e3);
      if (!readyForRemote[categoryName]) {
        readyForRemote[categoryName] = [];
      }
      readyForRemote[categoryName].push({
        i: item.id,
        // use current time as t to let it can be synced to other clients
        t: now,
        o: item._ctime, // original create time, useful for sorting
      });
    });
    // for safe, do a duplicate filter
    const idMap = {};
    readyForRemote[categoryName] = readyForRemote[categoryName].filter((item) => {
      if (!idMap[item.i]) {
        idMap[item.i] = true;
        return true;
      }
      return false;
    });
  });
  console.debug('[pixland]', 'ready for remote collection ->', readyForRemote, newPicData);
  // return the built data
  return [readyForRemote, newPicData];
};

export const syncData = async ({ immediate = false } = {}) => {
  // if user not login, skip
  if (!pixlandIns?.isLogin()) {
    return;
  }

  // check minimum sync time
  const now = Math.floor(Date.now() / 1e3);
  const minSpan = window.pixiviz?.config?.syncMinSpan || SYNC_TIME_MIN_SPAN;
  if (!immediate) {
    if (now - lastSyncTime < minSpan || syncTimeout || processingSync) {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        syncTimeout = null;
      }
      syncTimeout = setTimeout(() => {
        syncTimeout = null;
        syncData();
      }, minSpan * 1000);
      console.debug('[Pixland] Sync delay...', now - lastSyncTime);
      return;
    }
  } else if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  try {
    processingSync = true;
    // #0: Output logs for debugging
    console.debug('[Pixland] Start sync data...');
    console.debug('[Pixland] Last sync time', lastSyncTime, Math.floor(Date.now() / 1e3));
    // #1: Get user data from pixland
    const userData = await pixlandIns.getUserData();
    console.debug('[Pixland] User data gotten.', userData);
    const hash = await sha256(JSON.stringify(userData));
    console.debug('[Pixland] User data hashed.', hash);
    // #2: Check history sync
    const historyRes = await checkHistorySync(userData);
    // #3: Build new user data
    userData.history = historyRes[0];
    userData.picData = historyRes[1];
    // #4: Check collection sync
    const collectionRes = await checkCollectionSync(userData);
    userData.collection = collectionRes[0];
    userData.picData = collectionRes[1];
    // #5: Hash compare
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
  } catch (err) {
    console.error('[pixland] sync failed', err);
  } finally {
    // eslint-disable-next-line require-atomic-updates
    processingSync = false;
  }
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
  if (window.pixiviz?.config && !checkTrustHost(window.pixiviz.config)) {
    return;
  }
  if (!pixlandIns.isLogin() || window.pixiviz?.config?.pixland?.maintain) {
    return;
  }
  syncData();
});

window.addEventListener('beforeunload', () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  // try sync data last time
  if (!window.pixiviz?.pixland?.isLogin || window.pixiviz?.config?.pixland?.maintain) {
    return;
  }
  syncData({ immediate: true });
});

export default pixlandIns;
