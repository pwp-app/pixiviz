'use strict';

const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../proxy-config.conf');
const outputFile = path.resolve(__dirname, '../proxy-config.json');

let content;
try {
  content = fs.readFileSync(file, { encoding: 'utf-8' });
} catch (err) {
  console.error('Read proxy config error.', err);
  process.exit(-1);
}

if (!content) {
  console.error('Read proxy config error.', err);
  process.exit(-1);
}

const contents = content.split('\r\n');

const map = {};

contents.forEach((line) => {
  const parts = line.split(':');
  map[parts[0]] = parseFloat(parts[1]);
});

let current = 0;

Object.keys(map).forEach((key) => {
  const rate = map[key];
  map[key] = [current, current + rate];
  current += rate;
});

try {
  fs.writeFileSync(outputFile, JSON.stringify(map), { encoding: 'utf-8' });
  console.info('Proxy configuration has been generated.');
} catch (err) {
  console.error('Write proxy config error.', err);
  process.exit(-1);
}
