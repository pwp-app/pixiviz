const path = require('path');
const fs = require('fs');
const qiniu = require('./utils/qiniu');
const { qiniu: qiniuConfig } = require('../config.announcement');

const isDev = process.env.NODE_ENV === 'dev';
const fileName = `announcement${isDev ? '-dev' : ''}.json`;
const filePath = path.resolve(__dirname, `../${fileName}`);
const fileKey = `${qiniuConfig.prefix}${fileName}`;

const token = qiniu.fetchToken();

qiniu.upload(token, filePath, fileKey);
