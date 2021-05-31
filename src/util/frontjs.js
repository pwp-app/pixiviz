/* eslint-disable no-param-reassign */
(function(w) {
  w.frontjsConfig = {
    token: '0895802c5106769622a896b6d14df337',
    behaviour: 13,
    trustVendor: true,
    ignoreVendor: true,
    optimisedForSPA: true,
    useHistory: true,
    origin: [
      'pixiviz.pwp.app',
      'pixiv-image.pwp.link',
      'pixiv-image-jp.pwp.link',
      'pixiv-image-ru.pwp.link',
      'cfs.tigo.pwp.app',
      'config.backrunner.top',
    ],
    FPSThreshold: 8,
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
