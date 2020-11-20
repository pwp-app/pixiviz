const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const config = require('../config.announcement');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(customParseFormat);

const file = path.resolve(__dirname, `../${config.file}`);
const output = path.resolve(__dirname, '../announcement.json');
const devOutput = path.resolve(__dirname, '../announcement-dev.json');

if (!fs.existsSync(file)) {
  console.error('Cannot find announcement file.');
  process.exit(-1);
}

const content = fs.readFileSync(file, { encoding: 'utf-8' }).split('\r\n');

const anno = {};
const contents = [];
const footers = [];

let contentFlag = false;
let footerFlag = false;

content.forEach((item) => {
  if (!contentFlag) {
    if (!item) {
      contentFlag = true;
      return;
    }
    const entry = item.split(':');
    if (entry[0] === 'id') {
      anno[entry[0]] = parseInt(entry[1].trim(), 10);
    } else if (entry[0] === 'expires') {
      anno[entry[0]] = dayjs(entry[1], 'YYYY-MM-DD HH-mm-ss').format('YYYY-MM-DD HH:mm:ss');
    } else {
      anno[entry[0]] = entry[1].trim();
    }
    return;
  }
  if (item === '===') {
    anno.content = contents.join('').replace(/\r\n$/, '');
    footerFlag = true;
    return;
  }
  if (!footerFlag) {
    contents.push(`${item}\r\n`);
    return;
  }
  footers.push(`${item}\r\n`);
});

anno.footer = footers.join('').replace(/\r\n$/, '');

const json = JSON.stringify(anno, null, '  ');

fs.writeFileSync(output, json, { encoding: 'utf-8' });
fs.writeFileSync(devOutput, json, { encoding: 'utf-8' });