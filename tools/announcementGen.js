const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(customParseFormat);

const dirPath = path.resolve(__dirname, `../announcement`);
const output = path.resolve(__dirname, '../announcement.json');
const devOutput = path.resolve(__dirname, '../announcement-dev.json');

if (!fs.existsSync(dirPath)) {
  console.error('Cannot find announcement dir.');
  process.exit(-1);
}

const annoList = [];

const dir = fs.readdirSync(dirPath);

dir.forEach((file) => {
  if (path.extname(file) !== '.txt') {
    return;
  }

  const filePath = path.resolve(dirPath, file);

  const content = fs.readFileSync(filePath, { encoding: 'utf-8' }).split('\r\n');

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
        // 已经过期的不处理
        const date = dayjs(entry[1], 'YYYY-MM-DD HH-mm-ss');
        if (date.unix() <= dayjs().unix()) {
          return;
        }
        anno[entry[0]] = date.format('YYYY-MM-DD HH:mm:ss');
      } else if (entry[0] === 'matchVersion') {
        const temp = entry[1].split(',');
        const versions = [];
        temp.forEach((v) => {
          versions.push(v.trim());
        });
        anno[entry[0]] = versions;
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

  annoList.push(anno);
});

let json;

if (process.env.NODE_ENV === 'dev') {
  json = JSON.stringify(annoList, null, '  ');
} else {
  json = JSON.stringify(annoList);
}

if (process.env.NODE_ENV === 'dev') {
  fs.writeFileSync(devOutput, json, { encoding: 'utf-8' });
} else {
  fs.writeFileSync(output, json, { encoding: 'utf-8' });
  fs.writeFileSync(devOutput, json, { encoding: 'utf-8' });
}

console.log('Generation finished.');