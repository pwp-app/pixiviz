/* eslint-disable no-param-reassign */
export function initBaiduStat(config) {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  const trustHost = config?.statistics?.trust_host;
  if (!trustHost || !Array.isArray || typeof trustHost !== 'string') {
    return;
  }
  if (
    (Array.isArray(trustHost) && !trustHost.includes(window.location.host)) ||
    (typeof trustHost === 'string' && window.location.host !== trustHost)
  ) {
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
  }
}

export function initFrontJs(config) {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  const trustHost = config?.statistics?.trust_host;
  if (!trustHost || (!Array.isArray(trustHost) && typeof trustHost !== 'string')) {
    return;
  }
  if (
    (Array.isArray(trustHost) && !trustHost.includes(window.location.host)) ||
    (typeof trustHost === 'string' && window.location.host !== trustHost)
  ) {
    return;
  }
  // check privacy settings
  const privacyRemote = window.localStorage.getItem('privacy-remote');
  if (privacyRemote === 'false') {
    return;
  }
  // init frontjs
  (function(w) {
    w.frontjsConfig = {
      token: '0895802c5106769622a896b6d14df337',
      behaviour: 7,
      trustVendor: true,
      ignoreVendor: true,
      optimisedForSPA: true,
      useHistory: true,
      routeMapping: [
        ['/pic\\/\\d+/gi', '/pic/$1'],
        ['/artist\\/\\d+/gi', '/artist/$1'],
        ['/search\\/\\w+/gi', '/search/$1'],
      ],
      origin: [
        'pixiviz.pwp.app',
        'pixiv-image.pwp.link',
        'pixiv-image-jp.pwp.link',
        'pixiv-image-ru.pwp.link',
        'pixiv-image-lv.pwp.link',
        'cfs.tigo.pwp.app',
        'config.backrunner.top',
      ],
      FPSThreshold: 6,
    };
    w.frontjsTmpData = { r: [], e: [], l: [] };
    w.frontjsTmpCollector = function(ev) {
      (ev.message ? window.frontjsTmpData.e : window.frontjsTmpData.r).push([
        new Date().getTime(),
        ev,
      ]);
    };
    w.FrontJS = {
      addEventListener(t, f) {
        w.frontjsTmpData.l.push([t, f]);
        return f;
      },
      removeEventListener(t, f) {
        for (let i = 0; i < w.frontjsTmpData.l.length; i++) {
          t === w.frontjsTmpData.l[i][0] &&
            f === w.frontjsTmpData.l[i][1] &&
            w.frontjsTmpData.l.splice(i, 1);
        }
        return f;
      },
    };
    w.document.addEventListener('error', w.frontjsTmpCollector, true);
    w.addEventListener('error', w.frontjsTmpCollector, true);
    w.addEventListener(
      'load',
      () => {
        const n = w.document.createElement('script');
        n.src = 'https://frontjs-static.pgyer.com/dist/current/frontjs.web.min.js';
        w.document.body.appendChild(n);
      },
      true,
    );
  })(window);
}
