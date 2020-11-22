'use strict';

const path = require('path');
const fs = require('fs');
const packageInfo = require('../package.json');

const versionInfo = `export const version = '${packageInfo.version}';`;

try {
  fs.writeFileSync(
    path.resolve(__dirname, '../src/version.js'),
    versionInfo,
    { encoding: 'utf-8' }
  );
  console.info('Version info has been updated.', `v${packageInfo.version}`);
} catch (err) {
  console.error('Write version info error: ', err);
  process.exit(-1);
}
