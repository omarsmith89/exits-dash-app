import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const outDir = path.join(root, 'research', 'founding-batches');

const args = new Set(process.argv.slice(2));
const batchSizeArg = [...args].find((arg) => arg.startsWith('--batch-size='));
const startArg = [...args].find((arg) => arg.startsWith('--start='));
const limitArg = [...args].find((arg) => arg.startsWith('--limit='));

const batchSize = batchSizeArg ? Number(batchSizeArg.split('=')[1]) : 100;
const start = startArg ? Number(startArg.split('=')[1]) : 0;
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const lineCount = fs.readFileSync(templatePath, 'utf8').trim().split(/\r?\n/).length - 1;
const total = limit ? Math.min(limit, Math.max(0, lineCount - start)) : Math.max(0, lineCount - start);

fs.mkdirSync(outDir, { recursive: true });

for (let offset = 0; offset < total; offset += batchSize) {
  const batchStart = start + offset;
  const size = Math.min(batchSize, total - offset);
  const outFile = path.join(outDir, `founding-date-candidates-${String(batchStart).padStart(4, '0')}.csv`);
  const argsForChild = [
    'scripts/enrich-founding-candidates.mjs',
    `--start=${batchStart}`,
    `--limit=${size}`,
    `--out=${outFile}`,
    '--resume',
  ];

  console.log(`Running batch start=${batchStart} size=${size}`);
  const result = spawnSync('node', argsForChild, {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Completed ${Math.ceil(total / batchSize)} batch files in ${outDir}`);
