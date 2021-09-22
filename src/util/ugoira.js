import JSZip from 'jszip';

class Ugoira {
  constructor({ url, frames }) {
    this.zipUrl = url;
    this.frames = frames;
    this.blobMap = null;
    this.currentFrame = 0;
    this.onFrame = null;
    this.status = 'stopped';
  }
  load() {
    if (!this.zipUrl) {
      throw new Error('Ugoria zipUrl is not set.');
    }
    return new Promise((resolve) => {
      const req = new XMLHttpRequest();
      req.open('GET', this.zipUrl, true);
      req.responseType = 'arraybuffer';
      req.onload = () => {
        if (req.readyState === 4 && (req.status === 200 || req.status === 304)) {
          this.zipData = req.response;
          this.loaded = true;
          this.progress = 100;
          resolve(req.response);
        }
      };
      req.onprogress = (e) => {
        this.progress = parseInt((e.loaded / e.total) * 100, 10);
      };
      req.onloadstart = () => {
        this.progress = 0;
      };
      req.onloadend = () => {
        this.progress = 100;
      };
      req.onerror = function() {
        this.progress = 0;
        resolve(null);
      };
      req.onabort = function() {
        this.progress = 0;
        resolve(null);
      };
      this.request = req;
      req.send();
    });
  }
  async parse() {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(this.zipData);
    const blobMap = {};
    await Promise.all(
      this.frames.map((frame) => {
        return new Promise((resolve) => {
          zip
            .file(frame.file)
            .async('arraybuffer')
            .then((data) => {
              blobMap[frame.file] = window.URL.createObjectURL(
                new Blob([data], { type: 'image/jpeg' }),
              );
              resolve();
            });
        });
      }),
    );
    this.blobMap = blobMap;
    this.fullyLoaded = true;
    return blobMap;
  }
  play() {
    if (!this.fullyLoaded) {
      return;
    }
    if (!this.blobMap) {
      throw new Error('blobMap is empty.');
    }
    if (typeof this.onFrame !== 'function') {
      throw new Error('Cannot locate the onFrame function.');
    }
    const playFrame = () => {
      if (this.status === 'stopped') {
        return;
      }
      // current frame
      const { file, delay: nextDelay } = this.frames[this.currentFrame];
      const prevDelay =
        this.currentFrame === 0
          ? this.frames[this.frames.length - 1].delay
          : this.frames[this.currentFrame - 1].delay;
      if (
        !this.lastFrameTime ||
        (this.lastFrameTime && Date.now() - this.lastFrameTime >= prevDelay)
      ) {
        this.onFrame.call(this, this.blobMap[file]);
        this.lastFrameTime = Date.now();
      }
      // next frame
      if (this.currentFrame === this.frames.length - 1) {
        this.currentFrame = 0;
      } else {
        this.currentFrame += 1;
      }
      setTimeout(() => {
        playFrame();
      }, nextDelay);
    };
    this.status = 'playing';
    playFrame();
  }
  stop() {
    if (this.frameTimeout) {
      clearTimeout(this.frameTimeout);
      this.frameTimeout = null;
    }
    this.status = 'stopped';
  }
  cancel() {
    if (this.request) {
      this.request.abort();
    }
  }
}

export default Ugoira;
