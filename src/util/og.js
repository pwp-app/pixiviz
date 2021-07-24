let ogTags;

export const getOgTags = () => {
  if (ogTags) {
    return ogTags;
  }
  ogTags = {
    ogTitle: document.querySelector('#og-title'),
    ogDesc: document.querySelector('#og-desc'),
    ogImage: document.querySelector('#og-image'),
    ogUrl: document.querySelector('#og-url'),
  };

  return ogTags;
};

export const setOgTags = (tags, tagData) => {
  Object.keys(tagData).forEach((tagName) => {
    tags[tagName].setAttribute('content', tagData[tagName]);
  });
};
