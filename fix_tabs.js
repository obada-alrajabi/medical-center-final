import fs from 'fs';

const content = fs.readFileSync('seed.sql', 'utf8');
const lines = content.split(/\r?\n/);

let inCopyBlock = false;
const fixedLines = lines.map(line => {
  if (line.startsWith('COPY ')) {
    inCopyBlock = true;
    return line;
  }
  if (line.trim() === '\\.') {
    inCopyBlock = false;
    return line;
  }
  if (inCopyBlock) {
    // Replace any sequence of 2 or more spaces (including tabs) with a single tab character
    return line.replace(/\s{2,}/g, '\t');
  }
  return line;
});

fs.writeFileSync('seed.sql', fixedLines.join('\n'), 'utf8');
console.log('Fixed tabs in seed.sql successfully!');
