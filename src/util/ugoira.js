import JSZip from 'jszip';

class Ugoira {
  constructor({ url, frames }) {
    this.zipUrl = url;
    this.frames = frames;
    this.blobMap = null;
    this.currentFrame = 0;
    this.onFrame = null;
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
          resolve(req.response);
        }
      };
      req.onprogress = (e) => {
        this.percent = parseInt((e.loaded / e.total) * 100, 10);
      };
      req.onloadstart = () => {
        this.percent = 0;
      };
      req.onloadend = () => {
        this.percent = 100;
      };
      req.onerror = function() {
        resolve(null);
      };
      req.onabort = function() {
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
    return blobMap;
  }
  play() {
    if (!this.blobMap) {
      throw new Error('blobMap is empty.');
    }
    if (typeof this.onFrame !== 'function') {
      throw new Error('Cannot locate the onFrame function.');
    }
    const playFrame = () => {
      if (this.stopped) {
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
        this.onFrame(this.blobMap[file]);
        if (window.requestAnimationFrame) {
          this.lastFrameTime = Date.now();
        }
      }
      // next frame
      if (this.currentFrame === this.frames.length - 1) {
        this.currentFrame = 0;
      } else {
        this.currentFrame += 1;
      }
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          playFrame();
        });
      } else {
        setTimeout(() => {
          playFrame();
        }, nextDelay);
      }
    };
    playFrame();
  }
  stop() {
    if (this.frameTimeout) {
      clearTimeout(this.frameTimeout);
      this.frameTimeout = null;
    }
    this.stopped = true;
  }
  cancel() {
    if (this.request) {
      this.request.abort();
    }
  }
}

export default Ugoira;
