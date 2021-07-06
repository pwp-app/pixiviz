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
  const filePath = path.resolve(dirPath, file);
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    return;
  }
  if (path.extname(file) !== '.txt') {
    return;
  }

  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
  const lines = fileContent.includes('\r\n') ? fileContent.split('\r\n') : fileContent.split('\n');

  const anno = {};
  const contents = [];
  const footers = [];

  let contentFlag = false;
  let skipFlag = false;
  let footerFlag = false;

  lines.forEach((line) => {
    if (skipFlag) {
      return;
    }
    if (!contentFlag) {
      if (!line) {
        contentFlag = true;
        return;
      }
      const entry = line.split(':');
      if (entry[0] === 'id') {
        anno[entry[0]] = parseInt(entry[1].trim(), 10);
      } else if (entry[0] === 'start') {
        const date = dayjs(entry[1].trim(), 'YYYY-MM-DD HH-mm-ss');
        if (date.unix() <= dayjs().unix()) {
          skipFlag = true;
          return;
        }
        anno[entry[0]] = date.valueOf();
      } else if (entry[0] === 'expires') {
        // 已经过期的不处理
        const date = dayjs(entry[1].trim(), 'YYYY-MM-DD HH-mm-ss');
        if (date.unix() <= dayjs().unix()) {
          skipFlag = true;
          return;
        }
        anno[entry[0]] = date.valueOf();
      } else if (entry[0] === 'matchVersion') {
        const temp = entry[1].trim().split(',');
        const versions = [];
        temp.forEach((v) => {
          versions.push(v.trim());
        });
        anno[entry[0]] = versions;
      } else if (entry[0] === 'lastVisitAfter') {
        anno[entry[0]] = dayjs(entry[1].trim(), 'YYYY-MM-DD HH-mm-ss').valueOf();
      } else {
        anno[entry[0]] = entry[1].trim();
      }
      return;
    }
    if (line === '===') {
      anno.content = contents.join('').replace(/\r\n$/, '');
      footerFlag = true;
      return;
    }
    if (!footerFlag) {
      let textContent = line;
      const matched = /{{(.+)}}/.exec(textContent);
      if (matched) {
        textContent = textContent.replace(matched[0], `<a href="${matched[1]}">${matched[1]}</a>`);
      }
      contents.push(`${textContent}\r\n`);
      return;
    }
    footers.push(`${line}\r\n`);
  });

  if (skipFlag) return;

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
