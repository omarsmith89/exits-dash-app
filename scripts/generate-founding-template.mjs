import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dealsPath = path.join(root, 'public', 'VC_Exits_21-26_deal_data.txt');
const foundingPath = path.join(root, 'public', 'company_founding_dates.csv');
const outPath = path.join(root, 'research', 'founding-date-template.csv');

const dealText = fs.readFileSync(dealsPath, 'utf8').trim();
const foundingText = fs.existsSync(foundingPath) ? fs.readFileSync(foundingPath, 'utf8') : '';

const parseDelimited = (text, delimiter) => {
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
    } else if (ch === delimiter && !inQuotes) {
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

const companyKey = (value) => (value || '').trim().toLowerCase();
const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const [dealHeader, ...dealLines] = dealText.split(/\r?\n/);
const dealHeaders = dealHeader.split('\t');
const companyIndex = dealHeaders.indexOf('Companies');
const dealDateIndex = dealHeaders.indexOf('Deal Date');
const dealTypeIndex = dealHeaders.indexOf('Deal Type');
const hqIndex = dealHeaders.indexOf('HQ Location');

const dealRows = dealLines.map((line) => line.split('\t'));
const uniqueCompanies = new Map();
for (const cols of dealRows) {
  const company = (cols[companyIndex] || '').trim();
  if (!company || uniqueCompanies.has(companyKey(company))) continue;
  uniqueCompanies.set(companyKey(company), {
    company,
    latest_exit_date: (cols[dealDateIndex] || '').trim(),
    deal_type: (cols[dealTypeIndex] || '').trim(),
    hq_location: (cols[hqIndex] || '').trim(),
  });
}

const existingRows = parseDelimited(foundingText, ',');
const covered = new Set(
  existingRows.slice(1).map((row) => companyKey(row[0] || '')).filter(Boolean),
);

const templateRows = [
  ['company', 'latest_exit_date', 'deal_type', 'hq_location', 'founding_date', 'date_basis', 'source', 'confidence', 'notes'],
];

for (const [key, row] of uniqueCompanies.entries()) {
  if (covered.has(key)) continue;
  templateRows.push([
    row.company,
    row.latest_exit_date,
    row.deal_type,
    row.hq_location,
    '',
    '',
    '',
    '',
    '',
  ]);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, templateRows.map((row) => row.map(csvEscape).join(',')).join('\n'));

console.log(`Wrote ${templateRows.length - 1} missing companies to ${outPath}`);
