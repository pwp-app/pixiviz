import levelup from 'levelup';
import leveljs from 'level-js';

const idb = levelup(leveljs('pixiviz-data'));

export default {
  async get(key) {
    try {
      const res = await idb.get(key);
      return JSON.parse(res);
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw err;
    }
  },
  async set(key, value) {
    await idb.put(key, JSON.stringify(value));
  },
};
