import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const outDir = path.join(root, 'research', 'founding-sec-batches');

const args = new Set(process.argv.slice(2));
const batchSizeArg = [...args].find((arg) => arg.startsWith('--batch-size='));
const startArg = [...args].find((arg) => arg.startsWith('--start='));
const limitArg = [...args].find((arg) => arg.startsWith('--limit='));

const batchSize = batchSizeArg ? Number(batchSizeArg.split('=')[1]) : 50;
const start = startArg ? Number(startArg.split('=')[1]) : 0;
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const countTickerRows = () => {
  const rows = fs.readFileSync(templatePath, 'utf8').trim().split(/\r?\n/).slice(1);
  return rows.filter((line) => /\([A-Z]{2,5}:\s*[A-Z.\-]+\)/.test(line)).length;
};

const totalTicker = countTickerRows();
const total = limit ? Math.min(limit, Math.max(0, totalTicker - start)) : Math.max(0, totalTicker - start);

fs.mkdirSync(outDir, { recursive: true });

for (let offset = 0; offset < total; offset += batchSize) {
  const batchStart = start + offset;
  const size = Math.min(batchSize, total - offset);
  const outFile = path.join(outDir, `founding-date-sec-candidates-${String(batchStart).padStart(4, '0')}.csv`);
  const childArgs = [
    'scripts/enrich-founding-sec.mjs',
    `--start=${batchStart}`,
    `--limit=${size}`,
    `--out=${outFile}`,
  ];

  console.log(`Running SEC batch start=${batchStart} size=${size}`);
  const result = spawnSync('node', childArgs, {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Completed ${Math.ceil(total / batchSize)} SEC batch files in ${outDir}`);
