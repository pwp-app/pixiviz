export const getOgTags = () => {
  return {
    ogTitle: document.querySelector('#og-title'),
    ogDesc: document.querySelector('#og-desc'),
    ogImage: document.querySelector('#og-image'),
    ogUrl: document.querySelector('#og-url'),
  };
};
