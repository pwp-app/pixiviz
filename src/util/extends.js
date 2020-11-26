// extends Image
Image.prototype.load = function (url) {
  const thisImg = this;
  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    if (this.status == 200) {
      const h = req.getAllResponseHeaders();
      const m = h.match( /^Content-Type\:\s*(.*?)$/mi );
      const mimeType = m[1] || 'image/png';
      const blob = new Blob([this.response], { mimeType });
      thisImg.src = window.URL.createObjectURL(blob);
    } else {
      thisImg.failed = true;
    }
  }
  req.onprogress = function (e) {
    thisImg.percent = parseInt((e.loaded / e.total) * 100);
  }
  req.onloadstart = function () {
    thisImg.percent = 0;
  }
  req.onloadend = function () {
    thisImg.percent = 100;
  }
  thisImg.xhrReq = req;
  req.send();
}

Image.prototype.cancel = function () {
  if (this.xhrReq) {
    this.xhrReq.abort();
  }
  this.onload = () => {};
  this.onerror = () => {};
}

Image.prototype.percent = 0;