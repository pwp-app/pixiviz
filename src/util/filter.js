import { getSensitiveWords } from './sensitiveWords';

const sensitiveWords = getSensitiveWords();
const blockTags = [
  '尻',
  '極上の乳',
  '水着',
  '漫画素材工坊',
  '描き方',
  'お絵かきTIPS',
  ...sensitiveWords,
];
const mangaTags = ['漫画'];
const blockTitle = ['水着'];

const getFilterLevel = () => {
  if (window.pixiviz?.pixland?.isLogin) {
    return 4;
  }
  return 3;
};

export const imagePassCheck = (img) => {
  if (img.x_restrict || img.sanity_level > getFilterLevel()) {
    return false;
  }
  if (img.caption) {
    const captionBlocked = sensitiveWords.reduce((res, curr) => {
      if (res) return res;
      return res || img.caption.includes(curr);
    }, false);
    if (captionBlocked) {
      return false;
    }
  }
  const titleSensitive = sensitiveWords.reduce((res, curr) => {
    if (res) return res;
    return res || img.title.includes(curr);
  }, false);
  if (titleSensitive) {
    return false;
  }
  return true;
};

export const filterImages = (imgs, dropManga = true, dropTags = true) => {
  return imgs.filter((img) => {
    if (!img) {
      return false;
    }
    // filter restricted content
    if (
      img.restrict ||
      img.x_restrict ||
      img.sanity_level >= getFilterLevel() ||
      (img.type !== 'illust' && dropManga) ||
      (img.title.includes('漫画') && dropManga)
    ) {
      return false;
    }
    // filter title
    const titleSensitive = sensitiveWords.reduce((res, curr) => {
      if (res) return res;
      return res || img.title.includes(curr);
    }, false);
    if (titleSensitive) {
      return false;
    }
    const titleBlocked = blockTitle.reduce((res, curr) => {
      if (res) return res;
      return res || img.title.includes(curr);
    }, false);
    if (!window.pixiviz?.pixland?.isLogin && titleBlocked) {
      return false;
    }
    // filter tags
    if (Array.isArray(img.tags) && img.tags.length) {
      if (dropTags || dropManga) {
        for (let i = 0; i < img.tags.length; i++) {
          if (dropTags && blockTags.includes(img.tags[i].name)) {
            return false;
          }
          if (dropManga && mangaTags.includes(img.tags[i].name)) {
            return false;
          }
        }
      }
    }
    if (!window.pixiviz.infoMap[img.id]) window.pixiviz.infoMap[img.id] = img;
    return true;
  });
};
