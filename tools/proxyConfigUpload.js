const path = require('path');
const qiniu = require('./utils/qiniu');
const qiniuConfig = require('../config.qiniu');

const isDev = process.env.NODE_ENV === 'dev';
const fileName = 'proxy-config.json';
const filePath = path.resolve(__dirname, `../${fileName}`);
const fileKey = `${qiniuConfig.prefix}${isDev ? 'proxy-config-dev.json' : 'proxy-config.json'}`;

const token = qiniu.fetchToken();

qiniu.upload(token, filePath, fileKey);
