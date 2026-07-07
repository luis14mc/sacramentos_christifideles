import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?)$/.test(entry.name) && !full.endsWith('logger.ts'))
      files.push(full);
  }
  return files;
}

for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!/console\.(log|error|warn)/.test(content)) continue;

  const needsLogger =
    content.includes('console.log') ||
    content.includes('console.error') ||
    content.includes('console.warn');

  if (needsLogger && !content.includes("from '@/lib/logger'")) {
    const importLine = "import { logger } from '@/lib/logger';\n";
    if (content.startsWith("'use client'")) {
      content = content.replace(
        /^('use client';\r?\n\r?\n)/,
        `$1${importLine}`
      );
    } else {
      content = importLine + content;
    }
  }

  content = content
    .replace(/\bconsole\.log\b/g, 'logger.debug')
    .replace(/\bconsole\.error\b/g, 'logger.error')
    .replace(/\bconsole\.warn\b/g, 'logger.warn');

  fs.writeFileSync(file, content);
  console.log('Updated:', path.relative(process.cwd(), file));
}
