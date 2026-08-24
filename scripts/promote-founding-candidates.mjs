import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewPath = path.join(root, 'research', 'revisit-lists', 'founding-promotion-review.csv');
const publicFoundingPath = path.join(root, 'public', 'company_founding_dates.csv');
const allowedRecommendation = 'PROMOTE_CANDIDATE';

const OUTPUT_HEADERS = ['company', 'founding_date', 'date_basis', 'source', 'confidence', 'notes'];

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
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cols) => Object.fromEntries(headers.map((header, i) => [header, cols[i] ?? ''])));
};

const companyKey = (value) => String(value || '').trim().toLowerCase();
const normalizeCandidateDate = (value) => {
  const text = String(value || '').trim();
  let match = text.match(/^(\d{4})-00-00$/);
  if (match) return match[1];
  match = text.match(/^(\d{4})-(\d{2})-00$/);
  if (match) return match[2] === '00' ? match[1] : `${match[1]}-${match[2]}`;
  match = text.match(/^(\d{4})-00$/);
  if (match) return match[1];
  return text;
};

const existingRows = rowsFromCsv(publicFoundingPath);
const existingCompanies = new Set(existingRows.map((row) => companyKey(row.company)));
const reviewRows = rowsFromCsv(reviewPath);

const promotedRows = [];
for (const row of reviewRows) {
  if (row.recommendation !== allowedRecommendation) continue;
  if (!row.company || !row.founding_date || existingCompanies.has(companyKey(row.company))) continue;
  existingCompanies.add(companyKey(row.company));
  promotedRows.push({
    company: row.company,
    founding_date: normalizeCandidateDate(row.founding_date),
    date_basis: row.date_basis || 'operating_founding',
    source: row.source || '',
    confidence: row.confidence || '',
    notes: [row.notes, row.url ? `Source URL: ${row.url}` : ''].filter(Boolean).join('; '),
  });
}

const outputRows = [...existingRows, ...promotedRows];
fs.writeFileSync(
  publicFoundingPath,
  [OUTPUT_HEADERS, ...outputRows.map((row) => OUTPUT_HEADERS.map((header) => row[header] ?? ''))]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n'),
);

console.log(JSON.stringify({
  promoted: promotedRows.length,
  total_live_rows: outputRows.length,
}, null, 2));
