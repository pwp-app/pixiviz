const mangaTags = ['漫画'];

const filterImage = (img) => {
  if (
    img.x_restrict ||
    img.sanity_level > 4
  ) {
    return false;
  }
};

const filterImages = (imgs, dropManga = true) => {
  return imgs.filter((img) => {
    if (
      img.x_restrict ||
      img.sanity_level >= 4 ||
      (img.type !== 'illust' && dropManga) ||
      (img.title.includes('漫画') && dropManga)
    ) {
      return false;
    }
    if (img.tags && img.tags.length) {
      if (dropManga) {
        for (let i = 0; i < img.tags.length; i++) {
          if (mangaTags.includes(img.tags.name)) {
            return false;
          }
        }
      }
    }
    if (!window.pixiviz.infoMap[img.id]) window.pixiviz.infoMap[img.id] = img;
    return true;
  });
};

export {
  filterImage,
  filterImages,
};
