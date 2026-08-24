import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicFoundingPath = path.join(root, 'public', 'company_founding_dates.csv');
const outPath = path.join(root, 'research', 'revisit-lists', 'founding-promotion-review.csv');
const DAY_MS = 24 * 60 * 60 * 1000;

const SOURCES = [
  { dir: path.join(root, 'research', 'founding-sec-batches'), pattern: /^founding-date-sec-candidates-\d+\.csv$/ },
  { dir: path.join(root, 'research', 'founding-batches'), pattern: /^founding-date-candidates-\d+\.csv$/ },
  { dir: path.join(root, 'research'), pattern: /^founding-date-site-candidates-\d+\.csv$/ },
];

const HEADERS = [
  'company',
  'latest_exit_date',
  'deal_type',
  'hq_location',
  'founding_date',
  'date_basis',
  'source',
  'confidence',
  'status',
  'time_to_exit_years',
  'recommendation',
  'review_reason',
  'matched_name',
  'url',
  'notes',
];

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

const parseDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  match = text.match(/^(\d{4})-(\d{2})$/);
  if (match) return new Date(Date.UTC(+match[1], +match[2] - 1, 1));
  match = text.match(/^(\d{4})$/);
  if (match) return new Date(Date.UTC(+match[1], 0, 1));
  match = text.match(/(\d{1,2})-(\w{3})-(\d{4})/);
  if (match) return new Date(`${match[1]} ${match[2]} ${match[3]} UTC`);
  return null;
};

const yearsBetween = (startValue, endValue) => {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end || end < start) return '';
  return (((end - start) / DAY_MS) / 365.25).toFixed(2);
};

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

const inferDateBasis = (row) => {
  if (row.date_basis) return row.date_basis;
  const text = `${row.source || ''} ${row.notes || ''}`.toLowerCase();
  if (/founded|inception|official site|wikidata/.test(text)) return 'operating_founding';
  if (/incorporated|incorporation/.test(text)) return 'legal_incorporation';
  return '';
};

const recommendationFor = (row, timeToExit) => {
  const basis = row.date_basis;
  const confidence = row.confidence || '';
  const status = row.status || '';
  const years = timeToExit === '' ? null : Number(timeToExit);
  const text = `${row.company || ''} ${row.matched_name || ''} ${row.notes || ''}`.toLowerCase();

  if (!row.founding_date) return ['SKIP', 'No founding date candidate'];
  if (!['SEC_MATCH', 'LIKELY_MATCH', 'SITE_MATCH', 'REVIEW'].includes(status)) return ['SKIP', `Candidate status is ${status || 'blank'}`];
  if (/spac|blank check|special purpose acquisition|successor|reorganization|holding company/.test(text)) {
    return ['REVIEW', 'Possible issuer, SPAC, holding-company, or reorganization date'];
  }
  if (basis === 'operating_founding' && ['HIGH', 'MEDIUM_HIGH', 'MEDIUM'].includes(confidence)) {
    if (row.source === 'Wikidata' && confidence !== 'HIGH') {
      return ['REVIEW', 'Wikidata match below HIGH confidence needs review'];
    }
    return ['PROMOTE_CANDIDATE', 'Operating founding date with usable confidence'];
  }
  if (basis === 'legal_incorporation' && years !== null && years < 3) {
    return ['REVIEW', 'Very short legal age may be issuer/reorg incorporation'];
  }
  if (basis === 'legal_incorporation') {
    return ['REVIEW', 'Legal incorporation needs operating-company review'];
  }
  return ['REVIEW', 'Needs manual basis review'];
};

const existingRows = fs.existsSync(publicFoundingPath) ? rowsFromCsv(publicFoundingPath) : [];
const existingCompanies = new Set(existingRows.map((row) => companyKey(row.company)));
const seen = new Set();
const candidates = [];

for (const source of SOURCES) {
  if (!fs.existsSync(source.dir)) continue;
  for (const file of fs.readdirSync(source.dir).filter((name) => source.pattern.test(name)).sort()) {
    for (const row of rowsFromCsv(path.join(source.dir, file))) {
      if (!row.company || existingCompanies.has(companyKey(row.company)) || !row.founding_date) continue;
      const key = `${companyKey(row.company)}|${row.founding_date}|${row.source || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const enriched = { ...row, founding_date: normalizeCandidateDate(row.founding_date), date_basis: inferDateBasis(row) };
      const timeToExit = yearsBetween(enriched.founding_date, enriched.latest_exit_date);
      const [recommendation, reviewReason] = recommendationFor(enriched, timeToExit);
      candidates.push({
        ...enriched,
        time_to_exit_years: timeToExit,
        recommendation,
        review_reason: reviewReason,
        url: enriched.filing_url || enriched.page_url || '',
      });
    }
  }
}

candidates.sort((a, b) => {
  const rank = { PROMOTE_CANDIDATE: 0, REVIEW: 1, SKIP: 2 };
  return (rank[a.recommendation] ?? 9) - (rank[b.recommendation] ?? 9)
    || String(a.company).localeCompare(String(b.company));
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  [HEADERS, ...candidates.map((row) => HEADERS.map((header) => row[header] ?? ''))]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n'),
);

const summary = candidates.reduce((acc, row) => {
  acc[row.recommendation] = (acc[row.recommendation] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ output: outPath, rows: candidates.length, summary }, null, 2));
