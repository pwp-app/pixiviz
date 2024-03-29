import idb from './idb';
import { filterImages } from './filter';

export const COLLECTION_SIZE_LIMIT = 500;
const COLLECTION_DB_KEY = 'user-collection';

let userCollection = null;
let imageMap = {};

export class UserCollectionError extends Error {}

// get user collection from idb (collection is actually a big json)
export const getUserCollection = async ({ bypass = false } = {}) => {
  if (userCollection && !bypass) {
    return userCollection;
  }
  const stored = JSON.parse(await idb.get(COLLECTION_DB_KEY));
  // eslint-disable-next-line no-console
  console.debug('[Collection] user collection data gotten', stored);
  if (!stored) {
    // eslint-disable-next-line require-atomic-updates
    userCollection = {};
    return userCollection;
  }
  if (!userCollection) {
    userCollection = {};
  }
  Object.assign(userCollection, stored);
  // after read db
  Object.keys(userCollection).forEach((category) => {
    if (!Array.isArray(userCollection[category])) {
      return;
    }
    userCollection[category] = userCollection[category].map((item) => {
      if (!item._ctime) {
        return {
          ...item,
          _ctime: Math.floor(Date.now() / 1e3),
        };
      }
      if (`${item._ctime}`.length >= 13) {
        // value safety ensurance
        // eslint-disable-next-line no-param-reassign
        item._ctime = Math.floor(Date.now() / 1e3);
      }
      imageMap[category] = imageMap[category] || {};
      imageMap[category][item.id] = true;
      return item;
    });
    userCollection[category] = filterImages(
      userCollection[category]
        .sort((a, b) => {
          const timeOfA = a._otime || a._ctime;
          const timeOfB = b._otime || b._ctime;
          return timeOfB - timeOfA;
        })
        .filter((item) => !!item.image_urls),
      false,
      false,
    );
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
  await saveToDb();
};

export const setUserCollection = async (collection) => {
  userCollection = collection;
  imageMap = {};
  Object.keys(userCollection).forEach((category) => {
    userCollection[category] = Array.isArray(userCollection[category])
      ? userCollection[category].filter((item) => !!item)
      : [];
    userCollection[category].forEach((item) => {
      if (!imageMap[category]) {
        imageMap[category] = {};
      }
      imageMap[category][item.id] = true;
    });
  });
  await saveToDb();
};

export const setUserCollectByCategory = async (category, collection) => {
  if (!Array.isArray(collection)) {
    throw new TypeError('Collection should be an array.');
  }
  userCollection[category] = collection;
  imageMap[category] = {};
  userCollection[category].forEach((item) => {
    imageMap[category][item.id] = true;
  });
  await saveToDb();
};

export const removeFromCollection = async (category, imageId) => {
  if (!Array.isArray(userCollection[category])) {
    throw new UserCollectionError('Category not found.');
  }
  const idx = userCollection[category].findIndex((item) => item.id === imageId);
  if (idx >= 0) {
    // delete logically for sync
    userCollection[category].splice(idx, 1);
    imageMap[category][imageId] = false;
  }
  await saveToDb();
};

export const existedInCollection = async (imageId) => {
  if (!userCollection) {
    await getUserCollection({ bypass: true });
  }
  return Object.keys(userCollection).reduce((res, curr) => {
    return res || !!imageMap[curr]?.[imageId];
  }, false);
};

export const saveToDb = async () => {
  await idb.set(COLLECTION_DB_KEY, JSON.stringify(userCollection));
};
