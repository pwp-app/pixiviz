import { checkTrustHost } from './host';

const getGoogleFontHost = () => {
  if (checkTrustHost()) {
    return 'https://gfonts.pwp.link';
  }
  return 'https://fonts.googleapis.com';
};

export const loadGoogleFont = () => {
  const cssEl = document.createElement('link');
  cssEl.href = `${getGoogleFontHost()}/css2?family=Kosugi+Maru&family=Noto+Sans+SC:wght@100;300;400;500;700;900&display=swap`;
  cssEl.rel = 'stylesheet';
  cssEl.type = 'text/css';
  cssEl.crossOrigin = 'anonymous';
  document.querySelector('head').appendChild(cssEl);
};
