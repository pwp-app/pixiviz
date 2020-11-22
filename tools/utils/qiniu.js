const qiniuConfig = require('../../config.qiniu');
const qiniu = require('qiniu');

// Set qiniu config and uploader
const mac = new qiniu.auth.digest.Mac(qiniuConfig.key, qiniuConfig.secret);
const configuration = new qiniu.conf.Config();
configuration.zone = qiniu.zone[qiniuConfig.zone];
const formUploader = new qiniu.form_up.FormUploader(configuration);
const bucketManager = new qiniu.rs.BucketManager(mac, configuration);

const qiniuUtil = {
  fetchToken() {
    const options = {
      scope: qiniuConfig.bucket,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken(mac);
  },
  stat(bucket, key) {
    return new Promise((resolve) => {
      bucketManager.stat(bucket, key, function(err, respBody, respInfo) {
        if (err) {
          console.error(err);
          resolve(false);
        }
        if (respInfo.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },
  delete(bucket, key) {
    return new Promise((resolve) => {
      bucketManager.delete(bucket, key, function(err, respBody, respInfo) {
        if (err) {
          console.error(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },
  upload(token, file, fileKey) {
    return new Promise(async (resolve, reject) => {
      const statRes = await this.stat(qiniuConfig.bucket, fileKey);
      if (statRes) {
        const res = await this.delete(qiniuConfig.bucket, fileKey);
        if (!res) {
          return reject('Cannot delete existed file.');
        }
      }
      const putExtra = new qiniu.form_up.PutExtra();
      formUploader.putFile(token, fileKey, file, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          console.error('Upload failed.');
          resolve({
            success: false,
            resp: respErr,
          });
          return;
        }
        if (respInfo.statusCode === 200) {
          console.log('File is uploaded. Key: ' + fileKey);
          resolve({
            success: true,
          });
        } else {
          resolve({
            success: false,
            resp: respBody,
          });
        }
      });
    });
  },
};

module.exports = qiniuUtil;
