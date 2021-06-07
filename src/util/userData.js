import Dexie from 'dexie';

class PixivizUserDatabase extends Dexie {
  constructor() {
    super('pixiviz-user');
    this.version(1).stores({
      history: 'id, time',
    });
  }
}

export default new PixivizUserDatabase();
