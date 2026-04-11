import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const secDir = path.join(root, 'research', 'founding-sec-batches');
const outDir = path.join(root, 'research', 'revisit-lists');

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
};

const rowsFromCsv = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const rows = parseCsv(text);
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cols) => Object.fromEntries(headers.map((header, i) => [header, cols[i] ?? ''])));
};

const templateRows = rowsFromCsv(templatePath);
const tickerRegex = /\([A-Z]{2,5}:\s*[A-Z.\-]+\)/;
const tickerRows = templateRows.filter((row) => tickerRegex.test(row.company));
const privateRows = templateRows.filter((row) => !tickerRegex.test(row.company));

const secResults = fs.existsSync(secDir)
  ? fs.readdirSync(secDir)
      .filter((file) => /^founding-date-sec-candidates-\d+\.csv$/.test(file))
      .flatMap((file) => rowsFromCsv(path.join(secDir, file)))
  : [];

const unresolvedSec = secResults.filter((row) => row.status !== 'SEC_MATCH');
const secDoneCompanies = new Set(secResults.map((row) => row.company));
const secNotRunYet = tickerRows.filter((row) => !secDoneCompanies.has(row.company));

fs.mkdirSync(outDir, { recursive: true });

const writeCsv = (file, headers, rows) => {
  fs.writeFileSync(
    file,
    [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n'),
  );
};

writeCsv(
  path.join(outDir, 'sec-unresolved.csv'),
  ['company', 'ticker', 'latest_exit_date', 'deal_type', 'hq_location', 'status', 'notes', 'filing_url'],
  unresolvedSec,
);

writeCsv(
  path.join(outDir, 'sec-not-run-yet.csv'),
  ['company', 'latest_exit_date', 'deal_type', 'hq_location'],
  secNotRunYet,
);

writeCsv(
  path.join(outDir, 'private-revisit.csv'),
  ['company', 'latest_exit_date', 'deal_type', 'hq_location'],
  privateRows,
);

console.log(
  JSON.stringify(
    {
      sec_unresolved: unresolvedSec.length,
      sec_not_run_yet: secNotRunYet.length,
      private_revisit: privateRows.length,
    },
    null,
    2,
  ),
);
