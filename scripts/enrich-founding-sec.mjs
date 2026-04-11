import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const outPath = path.join(root, 'research', 'founding-date-sec-candidates.csv');
const args = new Set(process.argv.slice(2));
const REQUEST_TIMEOUT_MS = 20000;
const REQUEST_DELAY_MS = 400;
const MAX_RETRIES = 3;
const HEADERS = [
  'company',
  'ticker',
  'cik',
  'latest_exit_date',
  'deal_type',
  'hq_location',
  'founding_date',
  'source',
  'confidence',
  'status',
  'matched_name',
  'form',
  'filing_url',
  'notes',
];

const limitArg = [...args].find((arg) => arg.startsWith('--limit='));
const startArg = [...args].find((arg) => arg.startsWith('--start='));
const outArg = [...args].find((arg) => arg.startsWith('--out='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const start = startArg ? Number(startArg.split('=')[1]) : 0;
const outputPath = outArg ? path.resolve(root, outArg.split('=')[1]) : outPath;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const normalizeName = (value) => normalizeWhitespace(
  (value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['".,]/g, '')
    .replace(/\b(incorporated|inc|corp|corporation|company|co|ltd|limited|holdings|holding|group|plc|sa|ag|nv|ab)\b/g, ' ')
    .replace(/\s+/g, ' ')
).trim();

const parseTemplateRows = () => {
  const rows = parseCsv(fs.readFileSync(templatePath, 'utf8'));
  const headers = rows[0].map((header) => header.trim());
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  return rows.slice(1).map((cols) => ({
    company: cols[index.company] || '',
    latest_exit_date: cols[index.latest_exit_date] || '',
    deal_type: cols[index.deal_type] || '',
    hq_location: cols[index.hq_location] || '',
  }));
};

const extractTicker = (company) => {
  const match = String(company || '').match(/\(([A-Z]{2,5}):\s*([A-Z.\-]+)\)$/);
  return match ? match[2] : '';
};

const fetchText = async (url) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'exits-dash-app/1.0 (founding date enrichment)',
          Accept: 'text/plain, text/html, application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await sleep((attempt + 1) * 2000);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.text();
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= MAX_RETRIES) throw error;
      await sleep((attempt + 1) * 1500);
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
};

const fetchJson = async (url) => JSON.parse(await fetchText(url));

const parseFoundingFromText = (text) => {
  const flat = text.replace(/\s+/g, ' ');
  const patterns = [
    { re: /\bincorporated(?: in [A-Za-z .]+)? on ([A-Z][a-z]+ \d{1,2}, \d{4})\b/i, confidence: 'HIGH' },
    { re: /\bincorporated(?: in [A-Za-z .]+)? in ([A-Z][a-z]+ \d{4})\b/i, confidence: 'MEDIUM_HIGH' },
    { re: /\bincorporated(?: in [A-Za-z .]+)? in (\d{4})\b/i, confidence: 'MEDIUM' },
    { re: /\bfounded in ([A-Z][a-z]+ \d{4})\b/i, confidence: 'MEDIUM' },
    { re: /\bfounded in (\d{4})\b/i, confidence: 'LOW' },
  ];

  for (const pattern of patterns) {
    const match = flat.match(pattern.re);
    if (!match) continue;
    const raw = match[1];
    const date = (() => {
      if (/^\d{4}$/.test(raw)) return raw;
      if (/^[A-Z][a-z]+ \d{4}$/.test(raw)) {
        const [month, year] = raw.split(' ');
        const monthNum = new Date(`${month} 1, ${year} UTC`).getUTCMonth() + 1;
        return `${year}-${String(monthNum).padStart(2, '0')}`;
      }
      const parsed = new Date(`${raw} UTC`);
      if (Number.isNaN(parsed.getTime())) return '';
      return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
    })();
    return {
      founding_date: date,
      confidence: pattern.confidence,
      notes: `Extracted from filing text: ${match[0].slice(0, 160)}`,
    };
  }

  return null;
};

const loadTickerMap = async () => {
  const data = await fetchJson('https://www.sec.gov/files/company_tickers.json');
  const byTicker = new Map();
  const byName = new Map();
  for (const item of Object.values(data)) {
    const row = {
      cik: String(item.cik_str).padStart(10, '0'),
      ticker: item.ticker,
      title: item.title,
    };
    byTicker.set((item.ticker || '').toUpperCase(), row);
    byName.set(normalizeName(item.title), row);
  }
  return { byTicker, byName };
};

const pickSecMatch = (row, maps) => {
  const ticker = extractTicker(row.company);
  if (ticker && maps.byTicker.has(ticker.toUpperCase())) {
    return { ...maps.byTicker.get(ticker.toUpperCase()), match_type: 'ticker' };
  }
  const name = normalizeName(row.company.replace(/\s+\([^)]+\)$/, ''));
  if (maps.byName.has(name)) {
    return { ...maps.byName.get(name), match_type: 'name' };
  }
  return null;
};

const buildCandidate = async (row, maps) => {
  const ticker = extractTicker(row.company);
  const match = pickSecMatch(row, maps);
  if (!match) {
    return {
      ...row,
      ticker,
      cik: '',
      founding_date: '',
      source: 'SEC',
      confidence: 'NONE',
      status: 'NO_SEC_MATCH',
      matched_name: '',
      form: '',
      filing_url: '',
      notes: 'No SEC ticker/name match',
    };
  }

  try {
    await sleep(REQUEST_DELAY_MS);
    const submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${match.cik}.json`);
    const forms = submissions?.filings?.recent?.form || [];
    const accessionNumbers = submissions?.filings?.recent?.accessionNumber || [];
    const primaryDocs = submissions?.filings?.recent?.primaryDocument || [];
    const filingDates = submissions?.filings?.recent?.filingDate || [];
    const filingIdx = forms.findIndex((form) => ['S-1', 'S-1/A', 'F-1', 'F-1/A', '10-K', '20-F', '8-K'].includes(form));
    if (filingIdx === -1) {
      return {
        ...row,
        ticker: match.ticker,
        cik: match.cik,
        founding_date: '',
        source: 'SEC',
        confidence: 'LOW',
        status: 'NO_TARGET_FORM',
        matched_name: match.title,
        form: '',
        filing_url: '',
        notes: `Matched by ${match.match_type}, but no target form found in recent submissions`,
      };
    }

    const accession = accessionNumbers[filingIdx].replace(/-/g, '');
    const doc = primaryDocs[filingIdx];
    const form = forms[filingIdx];
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${Number(match.cik)}/${accession}/${doc}`;
    await sleep(REQUEST_DELAY_MS);
    const filingText = await fetchText(filingUrl);
    const parsed = parseFoundingFromText(filingText);

    if (!parsed) {
      return {
        ...row,
        ticker: match.ticker,
        cik: match.cik,
        founding_date: '',
        source: 'SEC',
        confidence: 'LOW',
        status: 'MATCH_NO_DATE',
        matched_name: match.title,
        form,
        filing_url: filingUrl,
        notes: `Matched by ${match.match_type}; no founding/incorporation text extracted from ${form} filed ${filingDates[filingIdx]}`,
      };
    }

    return {
      ...row,
      ticker: match.ticker,
      cik: match.cik,
      founding_date: parsed.founding_date,
      source: 'SEC filing',
      confidence: parsed.confidence,
      status: 'SEC_MATCH',
      matched_name: match.title,
      form,
      filing_url: filingUrl,
      notes: parsed.notes,
    };
  } catch (error) {
    return {
      ...row,
      ticker: match.ticker,
      cik: match.cik,
      founding_date: '',
      source: 'SEC',
      confidence: 'ERROR',
      status: 'ERROR',
      matched_name: match.title,
      form: '',
      filing_url: '',
      notes: error instanceof Error ? error.message : String(error),
    };
  }
};

const main = async () => {
  const rows = parseTemplateRows().filter((row) => extractTicker(row.company));
  const subset = limit ? rows.slice(start, start + limit) : rows.slice(start);
  const tickerMaps = await loadTickerMap();
  const results = [];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${HEADERS.join(',')}\n`);

  for (let i = 0; i < subset.length; i += 1) {
    const result = await buildCandidate(subset[i], tickerMaps);
    results.push(result);
    fs.appendFileSync(outputPath, `${HEADERS.map((header) => csvEscape(result[header] ?? '')).join(',')}\n`);
    if ((i + 1) % 10 === 0 || i === subset.length - 1) {
      console.log(`Progress: ${i + 1}/${subset.length}`);
    }
  }

  const summary = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${results.length} SEC candidate rows to ${outputPath}`);
  console.log(`Range: start=${start} limit=${limit ?? 'ALL'}`);
  console.log(`Summary: ${JSON.stringify(summary)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
