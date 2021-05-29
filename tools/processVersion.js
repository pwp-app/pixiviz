'use strict';

const path = require('path');
const fs = require('fs');
const packageInfo = require('../package.json');

const versionInfo = `
/* eslint-disable no-console */
export const version = '${packageInfo.version}';
console.log('%cPixiviz - v${packageInfo.version}\\nEnvironment - ${
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
}', 'color:#da7a85');
`;

try {
  fs.writeFileSync(path.resolve(__dirname, '../src/version.js'), versionInfo, {
    encoding: 'utf-8',
  });
  console.info('Version info has been updated.', `v${packageInfo.version}`);
} catch (err) {
  console.error('Write version info error: ', err);
  process.exit(-1);
}
