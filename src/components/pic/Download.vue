<template>
  <div class="pic-download">
    <div class="pic-download-title">
      <span>下载</span>
      <i
        class="pic-download-title-icon mobile-hide icon-qrcode"
        @click="openDownloadQRCode"
      >
        <QRCodeIcon />
      </i>
      <i
        class="pic-download-title-icon el-icon-setting"
        @click="openDownloadSettings"
      ></i>
    </div>
    <div class="pic-download-items">
      <el-button
        type="primary"
        @click="downloadCurrent"
        :disabled="disableDownloadCurrent"
        :style="downloadCurrentStyle"
        >{{ downloadCurrentText }}</el-button
      >
      <el-button
        type="primary"
        @click="downloadAll"
        v-if="showDownloadAll"
        :disabled="downloadStarted"
        >下载所有</el-button
      >
    </div>
    <el-dialog
      class="dialog pic-download-dialog"
      title="下载设置"
      :visible.sync="settingsVisible"
      @close="handleSettingsClose"
    >
      <el-form label-position="left" label-width="118px" :model="settingsForm">
        <el-form-item label="单张下载文件名">
          <el-input v-model="settingsForm.singleFileName"></el-input>
        </el-form-item>
        <el-form-item label="多张下载文件名">
          <el-input v-model="settingsForm.multiFileName"></el-input>
        </el-form-item>
      </el-form>
      <div class="pic-download-dialog-tips">
        <p>
          <span class="no-select">标题：</span>
          <span>{title}</span>
          <span class="no-select">，画师：</span>
          <span>{author}</span>
          <span class="no-select">，图片ID：</span>
          <span>{id}</span>
          <span class="no-select">，序号：</span>
          <span>{index}</span>
        </p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSettingsSubmit">确定</el-button>
      </div>
    </el-dialog>
    <DownloadQRCode ref="downloadQR" />
  </div>
</template>

<script>
import CONFIG from "../../config.json";
import QRCodeIcon from "../icons/qrcode";
import DownloadQRCode from "./DownloadQRCode";

export default {
  props: ["image", "loaded"],
  components: {
    QRCodeIcon,
    DownloadQRCode,
  },
  data() {
    return {
      // download
      downloadStarted: false,
      downloadCurrentLock: false,
      downloadCurrentStyle: null,
      // dialog
      settingsVisible: false,
      settingsForm: {
        singleFileName: this.$downloadSettings.singleFileName,
        multiFileName: this.$downloadSettings.multiFileName,
      },
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
      if (!this.image) return "";
      if (
        !this.loaded &&
        this.$store.state.pic.progress &&
        this.$store.state.pic.progress < 100
      ) {
        return `大图加载中（${this.$store.state.pic.progress}%）...`;
      }
      return this.image.page_count > 1 ? "保存当前" : "点我保存";
    },
    showDownloadAll() {
      if (!this.image) return false;
      return this.image.page_count > 1;
    },
    disableDownloadCurrent() {
      return this.downloadCurrentLock || !this.loaded;
    },
  },
  watch: {
    "$store.state.pic.progress": function (value) {
      if (this.$store.state.darkMode.enabled) {
        this.downloadCurrentStyle = `background-image: linear-gradient(to right, #d7707c 0%, #d7707c ${value}%, #999 ${value}%, #999 100%) !important;`;
      } else {
        this.downloadCurrentStyle = `background-image: linear-gradient(to right, #da7a85 0%, #da7a85 ${value}%, #999 ${value}%, #999 100%) !important;`;
      }
      this.$forceUpdate();
    },
  },
  methods: {
    openDownloadQRCode() {
      this.$refs.downloadQR.open();
    },
    openDownloadSettings() {
      this.settingsVisible = true;
    },
    handleSettingsClose() {
      const keys = ["singleFileName", "multiFileName"];
      keys.forEach((key) => {
        this.settingsForm[key] = this.$downloadSettings[key];
      });
    },
    handleSettingsSubmit() {
      const keys = ["singleFileName", "multiFileName"];
      const defaultValue = {
        singleFileName: "{title}-{id}",
        multiFileName: "{title}-{id}-{index}",
      };
      keys.forEach((key) => {
        this.$downloadSettings[key] =
          this.settingsForm[key] || defaultValue[key];
      });
      // 写入localStorage
      window.localStorage.setItem(
        "download-settings",
        JSON.stringify(this.$downloadSettings)
      );
      this.settingsVisible = false;
    },
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
    getDownloadName(type) {
      let name;
      if (type === "single") {
        name = this.$downloadSettings.singleFileName;
      } else {
        name = this.$downloadSettings.multiFileName;
      }
      name = name
        .replace("{title}", this.image.title)
        .replace("{id}", this.image.id)
        .replace("{author}", this.image.user.name);
      return name;
    },
    downloadImage(src, name, queue = false) {
      if (queue) {
        window.pixiviz.downloadQueue.push({
          url: src,
          name: name,
        });
        return;
      }
      const image = new Image();
      image.setAttribute("crossOrigin", "*");
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, image.width, image.height);
        const url = canvas.toDataURL("image/png");
        let a = document.createElement("a");
        a.download = name;
        a.href = url;
        a.click();
        a = null;
        if (this.$store.getters["download/hasName"](name)) {
          this.$store.commit("download/removeItem", name);
        }
      };
      setTimeout(() => {
        if (!image.blobLoaded) {
          this.$store.commit("download/addItem", {
            name,
            image,
          });
        }
      }, 1000);
      image.load(src);
    },
    downloadCurrent() {
      this.downloadCurrentStyle = null;
      if (!this.downloadCurrentLock) {
        this.downloadCurrentLock = true;
        setTimeout(() => {
          this.downloadCurrentLock = false;
        }, 1000);
      }
      this.$emit("download-current");
    },
    downloadAll() {
      if (!this.originalUrls) {
        this.$message.error("无法获取所有图片的文件地址");
        return;
      }
      // notice
      this.notification = this.$notify({
        title: "",
        position: "top-right",
        customClass: "oneline-notice-container",
        dangerouslyUseHTMLString: true,
        duration: 2000,
        message: `
          <div class="oneline-notice">
            <span data-name="notice-download">您的下载已经开始了~</span>
          </div>`,
      });
      const name = this.getDownloadName("multi");
      for (let i = 0; i < this.originalUrls.length; i++) {
        const {
          image_urls: { original: url },
        } = this.originalUrls[i];
        this.downloadImage(
          url.replace("i.pximg.net", CONFIG.DOWNLOAD_HOST),
          name.replace("{index}", i),
          window.isSafari
        );
      }
      if (window.isSafari) {
        if (!window.downloadTimer) {
          this.createDownloadTimer();
        }
      }
      this.downloadStarted = true;
      setTimeout(() => {
        this.downloadStarted = false;
      }, 3000);
      this.contextMenuVisible = false;
    },
  },
};
</script>