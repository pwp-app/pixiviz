// extends Image
Image.prototype.load = function(url) {
  const thisImg = this;
  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    if (req.readyState === 4 && (req.status === 200 || req.status === 304)) {
      const h = req.getAllResponseHeaders();
      const m = h.match(/^Content-Type:\s*(.*?)$/im);
      const mimeType = m[1] || 'image/png';
      const blob = new Blob([req.response], { type: mimeType });
      thisImg.src = window.URL.createObjectURL(blob);
      thisImg.blob = blob;
      thisImg.blobLoaded = true;
    } else {
      thisImg.failed = true;
      if (typeof thisImg.onerror === 'function') {
        thisImg.onerror();
      }
    }
  };
  req.onprogress = function(e) {
    thisImg.percent = parseInt((e.loaded / e.total) * 100, 10);
  };
  req.onloadstart = function() {
    thisImg.percent = 0;
  };
  req.onloadend = function() {
    thisImg.percent = 100;
  };
  req.onerror = function() {
    if (typeof thisImg.onerror === 'function') {
      thisImg.onerror();
    }
  };
  thisImg.xhrReq = req;
  req.send();
};

Image.prototype.getSize = function(url) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('HEAD', url, true);
    req.onreadystatechange = function() {
      if (this.readyState === this.DONE) {
        resolve(parseInt(req.getResponseHeader('Content-Length'), 10));
      }
    };
    req.onerror = function() {
      reject(new Error('Image head request failed.'));
    };
    req.send();
  });
};

Image.prototype.cancel = function() {
  if (this.xhrReq) {
    this.xhrReq.abort();
  }
  this.onload = () => {};
  this.onerror = () => {};
};

Image.prototype.percent = 0;
