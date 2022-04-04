/* eslint-disable no-param-reassign */
import { version } from '../version';

export function initBaiduStat() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  const privacyStatistics = window.localStorage.getItem('privacy-statistics');
  if (privacyStatistics !== 'false') {
    window._hmt = window._hmt || [];
    (function() {
      const hm = document.createElement('script');
      hm.src = 'https://hm.baidu.com/hm.js?86b00bd26cf7bf64316c0e31c783614b';
      const s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(hm, s);
    })();
    window._hmt.push(['_setCustomVar', 1, 'siteVersion', version, 1]);
    // report st
    window._hmt.push([
      '_setCustomVar',
      2,
      'st',
      new URLSearchParams(window.location.search.slice(1) || '').get('st'),
      1,
    ]);
  }
}
