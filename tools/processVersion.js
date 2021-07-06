'use strict';

const path = require('path');
const fs = require('fs');
const packageInfo = require('../package.json');

const versionInfo =
  `
/* eslint-disable no-undef */
/* eslint-disable no-console */
export const version = '${packageInfo.version}';
console.log('%cPixiviz - v${packageInfo.version}\\nEnvironment - ${
    process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
  }', 'color:#da7a85');
window._hmt && window._hmt.push(['_setCustomVar', 1, 'siteVersion', '${packageInfo.version}', 1]);
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
