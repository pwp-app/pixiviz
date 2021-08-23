'use strict';

const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const packageInfo = require('../package.json');

dayjs.extend(utc);
dayjs.extend(timezone);

const buildTime = dayjs()
  .tz('Asia/Shanghai')
  .format('YYYY-MM-DD HH:mm:ss');
const versionInfo =
  `
/* eslint-disable no-undef */
/* eslint-disable no-console */
export const version = '${packageInfo.version}';
export const buildTime = '${buildTime}';
console.log('%cPixiviz - v${packageInfo.version}\\nEnvironment - ${
    process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
  }\\nBuild time: ${buildTime}', 'color:#da7a85');
`.trim() + '\n';

try {
  fs.writeFileSync(path.resolve(__dirname, '../src/version.js'), versionInfo, {
    encoding: 'utf-8',
  });
  console.info('Version info has been updated.', `v${packageInfo.version}`);
} catch (err) {
  console.error('Write version info error: ', err);
  process.exit(-1);
}
