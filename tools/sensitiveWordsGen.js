const fs = require('fs');
const path = require('path');

const SensitiveWordsSource = fs
  .readFileSync(path.resolve(__dirname, '../src/resources/sensitiveWordsSource.txt'), {
    encoding: 'utf-8',
  })
  .split('\n')
  .map((item) => item.trim())
  .filter((item) => !!item);

fs.writeFileSync(
  path.resolve(__dirname, '../src/resources/sensitiveWords.json'),
  JSON.stringify(SensitiveWordsSource.map((item) => btoa(encodeURIComponent(item)))),
  { encoding: 'utf-8' },
);
