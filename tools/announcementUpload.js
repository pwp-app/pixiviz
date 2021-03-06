const path = require('path');
const qiniu = require('./utils/qiniu');
const qiniuConfig = require('../config.qiniu');

const isDev = process.env.NODE_ENV === 'dev';
const fileName = `announcement${isDev ? '-dev' : ''}.json`;
const filePath = path.resolve(__dirname, `../${fileName}`);
const fileKey = `${qiniuConfig.prefix}${fileName}`;

const token = qiniu.fetchToken();

qiniu.upload(token, filePath, fileKey);
