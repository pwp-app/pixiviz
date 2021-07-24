let ogTags;

const createProxy = (el, fn) => {
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      el.setAttribute.call(el, ...args);
      return target.call(thisArg, ...args);
    },
  });
};

export const getOgTags = () => {
  if (ogTags) {
    return ogTags;
  }
  const titleEl = document.querySelector('#og-title');
  titleEl.setAttribute = createProxy(document.querySelector('#meta-name'), titleEl.setAttribute);
  const descEl = document.querySelector('#og-desc');
  descEl.setAttribute = createProxy(document.querySelector('#meta-desc'), descEl.setAttribute);
  const imageEl = document.querySelector('#og-image');
  imageEl.setAttribute = createProxy(document.querySelector('#meta-image'), imageEl.setAttribute);
  ogTags = {
    ogTitle: titleEl,
    ogDesc: descEl,
    ogImage: imageEl,
    ogUrl: document.querySelector('#og-url'),
  };

  return ogTags;
};

export const setOgTags = (tags, tagData) => {
  Object.keys(tagData).forEach((tagName) => {
    tags[tagName].setAttribute('content', tagData[tagName]);
  });
};
