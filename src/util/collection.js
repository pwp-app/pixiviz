import idb from './idb';
import { filterImages } from './filter';

const COLLECTION_SIZE_LIMIT = 500;
const COLLECTION_DB_KEY = 'user-collection';

let userCollection = {};
let imageMap = {};

export class UserCollectionError extends Error {}

export const getUserCollection = async ({ bypass = false } = {}) => {
  if (userCollection && !bypass) {
    return userCollection;
  }
  const stored = JSON.parse(await idb.get(COLLECTION_DB_KEY));
  if (!Array.isArray(stored)) {
    return null;
  }
  Object.assign(userCollection, stored);
  // after read db
  Object.keys(userCollection).forEach((category) => {
    if (!Array.isArray(userCollection[category])) {
      return;
    }
    userCollection[category] = filterImages(userCollection[category], false, false).map((item) => {
      if (!item._ctime) {
        return {
          ...item,
          _ctime: Math.floor(Date.now() / 1e3),
        };
      }
      imageMap[category] = imageMap[category] || {};
      imageMap[category][item.id] = true;
      return item;
    });
    userCollection[category].sort((a, b) => b._ctime - a._ctime);
  });
  return userCollection;
};

export const addUserCollection = async (category, image) => {
  if (!Array.isArray(userCollection[category])) {
    userCollection[category] = [];
  }
  // check size limit
  if (
    userCollection[category]?.length &&
    userCollection[category]?.length + 1 > COLLECTION_SIZE_LIMIT
  ) {
    throw new UserCollectionError('exceeded size limit');
  }
  if (!imageMap[category]) {
    imageMap[category] = {};
  }
  if (imageMap[category][image.id]) {
    const idx = userCollection[category].findIndex((item) => item.id === image.id);
    if (idx >= 0) {
      userCollection[category].splice(idx, 1);
    }
  }
  imageMap[category][image.id] = true;
  userCollection[category].unshift({
    ...image,
    _ctime: Math.floor(Date.now() / 1e3),
  });
  saveToDb();
};

export const setUserCollection = (collection) => {
  userCollection = collection;
  imageMap = {};
  Object.keys(userCollection).forEach((category) => {
    userCollection[category] = Array.isArray(userCollection[category])
      ? userCollection[category]
      : [];
    userCollection[category].forEach((item) => {
      if (!imageMap[category]) {
        imageMap[category] = {};
      }
      imageMap[category][item.id] = true;
    });
  });
  saveToDb();
};

export const setUserCollectByCategory = (category, collection) => {
  if (!Array.isArray(collection)) {
    throw new TypeError('Collection should be an array.');
  }
  userCollection[category] = collection;
  imageMap[category] = {};
  userCollection[category].forEach((item) => {
    imageMap[category][item.id] = true;
  });
  saveToDb();
};

export const removeFromCollection = (category, imageId) => {
  if (!Array.isArray(userCollection[category])) {
    throw new UserCollectionError('Category not found.');
  }
  const idx = userCollection[category].findIndex((item) => item.id === imageId);
  if (idx >= 0) {
    userCollection[category].splice(idx, 1);
  }
  saveToDb();
};

export const saveToDb = async () => {
  await idb.set(COLLECTION_DB_KEY, JSON.stringify(userCollection));
};
