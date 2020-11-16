<template>
  <div class="pic-download">
    <div class="pic-download-title">
      <span>下载</span>
    </div>
    <div class="pic-download-items">
      <el-button type="primary" @click="downloadCurrent" :disabled="disableDownloadCurrent">{{ downloadCurrentText }}</el-button>
      <el-button type="primary" @click="downloadAll" v-if="showDownloadAll" :disabled="downloadStarted">下载所有</el-button>
    </div>
  </div>
</template>

<script>
import CONFIG from '../../config.json';

export default {
  props: ['image', 'loaded'],
  data() {
    return {
      // download
			downloadStarted: false,
			downloadCurrentLock: false,
    };
  },
  computed: {
    originalUrls() {
      if (!this.image || this.image.page_count < 2) {
        return null;
      } else {
        return this.image.meta_pages;
      }
    },
    downloadCurrentText() {
      if (!this.image) return '';
      return this.image.page_count > 1 ? '下载当前' : '点我下载';
		},
		showDownloadAll() {
			return this.image.page_count > 1;
    },
    disableDownloadCurrent() {
      return this.downloadCurrentLock || !this.loaded;
    }
  },
  methods: {
    createDownloadTimer() {
			window.pixiviz.downloadTimer = setInterval(() => {
				if (window.pixiviz.downloadQueue.length) {
					const image = window.pixiviz.downloadQueue.shift();
					this.downloadImage(image.url, image.name);
					window.pixiviz.downloadIdleSeconds = 0;
				} else {
					window.pixiviz.downloadIdleSeconds++;
					// 闲置超过10秒即销毁
					if (window.pixiviz.downloadIdleSeconds > 10) {
						clearInterval(window.pixiviz.downloadTimer);
					}
				}
			}, 1000);
		},
    downloadImage(src, name, queue = false) {
      if (queue) {
        window.pixiviz.downloadQueue.push({
          url: src,
          name: name
        });
        return;
      }
      const image = new Image();
      image.setAttribute('crossOrigin', '*');
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, image.width, image.height);
        const url = canvas.toDataURL('image/jpeg');
        let a = document.createElement('a');
        a.download = name;
        a.href = url;
        a.click();
        a = null;
      };
      image.src = src;
		},
		downloadCurrent() {
			if (!this.downloadCurrentLock) {
				this.downloadCurrentLock = true;
				setTimeout(() => {
					this.downloadCurrentLock = false;
				}, 1000);
      }
			this.$emit('download');
		},
    downloadAll() {
      console.log(this.originalUrls);
      if (!this.originalUrls) {
				this.$message.error('无法获取所有图片的文件地址');
        return;
      }
      // notice
      this.notification = this.$notify({
        title: '',
        position: 'top-right',
        customClass: 'oneline-notice-container',
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `
          <div class="oneline-notice">
            <span data-name="notice-download">${this.downloadStarted ? '您的下载已经开始了，请耐心等待' : '您的下载开始了，请注意浏览器的提示'}</span>
          </div>`
      });
      // lock
      if (this.downloadStarted) {
        setTimeout(() => {
          this.downloadStarted = false;
        }, 3000);
        return;
      }
      for (let i = 0; i < this.originalUrls.length; i++) {
        const { image_urls: { original: url } } = this.originalUrls[i];
        this.downloadImage(url.replace('i.pximg.net', CONFIG.DOWNLOAD_HOST),
          `${this.image.id}-${i}.jpg`, window.isSafari);
      }
      if (window.isSafari) {
        if (!window.downloadTimer) {
          this.createDownloadTimer();
        }
      }
      this.downloadStarted = true;
      this.contextMenuVisible = false;
    },
  }
}
</script>