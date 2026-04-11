import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const outPath = path.join(root, 'research', 'founding-date-candidates.csv');
const args = new Set(process.argv.slice(2));
const REQUEST_TIMEOUT_MS = 15000;
const FLUSH_EVERY = 25;
const REQUEST_DELAY_MS = 350;
const MAX_RETRIES = 4;
const HEADERS = [
  'company',
  'latest_exit_date',
  'deal_type',
  'hq_location',
  'normalized_company',
  'founding_date',
  'source',
  'confidence',
  'score',
  'status',
  'wikidata_id',
  'wikidata_label',
  'notes',
];

if (args.has('--help')) {
  console.log(`
Usage:
  node scripts/enrich-founding-candidates.mjs [--start=N] [--limit=N] [--out=path] [--resume]

What it does:
  - Reads research/founding-date-template.csv
  - Searches Wikidata for each missing company
  - Pulls inception date candidates and basic match metadata
  - Writes ranked candidates to research/founding-date-candidates.csv

Notes:
  - This is a candidate-generation pass, not a final verifier.
  - Review ambiguous rows before moving them into public/company_founding_dates.csv.
`);
  process.exit(0);
}

const limitArg = [...args].find((arg) => arg.startsWith('--limit='));
const startArg = [...args].find((arg) => arg.startsWith('--start='));
const outArg = [...args].find((arg) => arg.startsWith('--out='));
const resume = args.has('--resume');
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const start = startArg ? Number(startArg.split('=')[1]) : 0;
const outputPath = outArg ? path.resolve(root, outArg.split('=')[1]) : outPath;

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
  'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY','DC',
]);

const COUNTRY_ALIASES = new Map([
  ['usa', 'united states'],
  ['u.s.', 'united states'],
  ['u.s.a.', 'united states'],
  ['uk', 'united kingdom'],
  ['uae', 'united arab emirates'],
]);

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const stripTicker = (value) => value.replace(/\s+\([A-Z]+:\s*[^)]+\)$/g, '').trim();
const normalizeName = (value) => normalizeWhitespace(
  stripTicker(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['".,]/g, '')
    .replace(/\b(incorporated|inc|corp|corporation|company|co|ltd|limited|holdings|holding|group|plc|sa|ag|nv|ab)\b/g, ' ')
    .replace(/\s+/g, ' ')
).trim();

const extractCountry = (hq) => {
  const parts = String(hq || '')
    .replace(/"/g, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return '';
  const last = parts.at(-1).toLowerCase();
  if (US_STATES.has(last.toUpperCase())) return 'united states';
  return COUNTRY_ALIASES.get(last) || last;
};

const parseTemplateRows = () => {
  const text = fs.readFileSync(templatePath, 'utf8');
  const rows = parseCsv(text);
  const headers = rows[0].map((header) => header.trim());
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  return rows.slice(1).map((cols) => ({
    company: cols[index.company] || '',
    latest_exit_date: cols[index.latest_exit_date] || '',
    deal_type: cols[index.deal_type] || '',
    hq_location: cols[index.hq_location] || '',
  }));
};

const fetchJson = async (url) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'exits-dash-app/1.0 (founding date enrichment)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (response.status === 429 && attempt < MAX_RETRIES) {
        clearTimeout(timer);
        await sleep((attempt + 1) * 2000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      clearTimeout(timer);
      return response.json();
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= MAX_RETRIES) throw error;
      await sleep((attempt + 1) * 1500);
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
};

const getClaimValue = (entity, property) => entity?.claims?.[property] || [];

const getInception = (entity) => {
  const claim = getClaimValue(entity, 'P571')[0];
  const time = claim?.mainsnak?.datavalue?.value?.time;
  if (!time) return '';
  const cleaned = time.replace(/^\+/, '');
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (!match) return '';
  const [, year, month, day] = match;
  if (month === '01' && day === '01') return year;
  if (day === '01') return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const getCountryLabels = (entity, labelMap) => {
  const claims = getClaimValue(entity, 'P17');
  return claims
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)
    .map((id) => labelMap.get(id))
    .filter(Boolean)
    .map((label) => label.toLowerCase());
};

const scoreCandidate = ({ companyNorm, countryNorm, resultNorm, aliasesNorm, countryLabels }) => {
  let score = 0;
  if (companyNorm === resultNorm) score += 70;
  else if (resultNorm.includes(companyNorm) || companyNorm.includes(resultNorm)) score += 45;

  if (aliasesNorm.includes(companyNorm)) score += 20;

  if (countryNorm && countryLabels.includes(countryNorm)) score += 10;

  return score;
};

const searchWikidata = async (company) => {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'en');
  url.searchParams.set('type', 'item');
  url.searchParams.set('limit', '5');
  url.searchParams.set('search', stripTicker(company));
  return fetchJson(url);
};

const fetchEntityBundle = async (ids) => {
  if (!ids.length) return {};
  const url = new URL(`https://www.wikidata.org/wiki/Special:EntityData/${ids.join('|')}.json`);
  return fetchJson(url);
};

const candidateForError = (row, companyNorm, message) => ({
  ...row,
  normalized_company: companyNorm,
  source: 'Wikidata',
  wikidata_id: '',
  wikidata_label: '',
  founding_date: '',
  confidence: 'ERROR',
  score: 0,
  status: 'ERROR',
  notes: message,
});

const buildCandidate = async (row) => {
    const companyNorm = normalizeName(row.company);
    const countryNorm = extractCountry(row.hq_location);

    try {
      const search = await searchWikidata(row.company);
      const searchResults = search.search || [];
      if (!searchResults.length) {
        return {
          ...row,
          normalized_company: companyNorm,
          source: 'Wikidata',
          wikidata_id: '',
          wikidata_label: '',
          founding_date: '',
          confidence: 'NONE',
          score: 0,
          status: 'NO_MATCH',
          notes: 'No Wikidata search results',
        };
      }

      const ids = searchResults.map((item) => item.id);
      const bundle = await fetchEntityBundle(ids);
      const entities = bundle.entities || {};
      const labelMap = new Map(
        Object.entries(entities).map(([id, entity]) => [
          id,
          entity?.labels?.en?.value || entity?.labels?.en?.language || '',
        ]),
      );

      const candidates = searchResults.map((result) => {
        const entity = entities[result.id];
        const label = result.label || entity?.labels?.en?.value || '';
        const aliases = (entity?.aliases?.en || []).map((alias) => alias.value);
        const resultNorm = normalizeName(label);
        const aliasesNorm = aliases.map(normalizeName);
        const countryLabels = getCountryLabels(entity, labelMap);
        const foundingDate = getInception(entity);
        const score = scoreCandidate({ companyNorm, countryNorm, resultNorm, aliasesNorm, countryLabels });
        return {
          ...row,
          normalized_company: companyNorm,
          source: 'Wikidata',
          wikidata_id: result.id,
          wikidata_label: label,
          founding_date: foundingDate,
          confidence: score >= 85 && foundingDate ? 'HIGH' : score >= 60 && foundingDate ? 'MEDIUM' : foundingDate ? 'LOW' : 'NONE',
          score,
          status: foundingDate ? 'CANDIDATE' : 'NO_INCEPTION',
          notes: [
            countryNorm ? `hq=${countryNorm}` : '',
            countryLabels.length ? `wikidata_country=${countryLabels.join('|')}` : '',
            aliases.length ? `aliases=${aliases.slice(0, 3).join('|')}` : '',
            result.description ? `desc=${result.description}` : '',
          ].filter(Boolean).join('; '),
        };
      }).sort((a, b) => b.score - a.score);

      const best = candidates[0];
      let status = 'NO_MATCH';
      if (best.score >= 85 && best.founding_date) status = 'LIKELY_MATCH';
      else if (best.founding_date) status = 'REVIEW';

      return { ...best, status };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return candidateForError(row, companyNorm, error);
    }
};

const rowToCsv = (row) => HEADERS.map((header) => csvEscape(row[header] ?? '')).join(',');

const getResumeRows = () => {
  if (!resume || !fs.existsSync(outputPath)) return [];
  const text = fs.readFileSync(outputPath, 'utf8').trim();
  if (!text) return [];
  const rows = parseCsv(text);
  if (rows.length <= 1) return [];
  return rows.slice(1).map((cols) => Object.fromEntries(HEADERS.map((header, i) => [header, cols[i] ?? ''])));
};

const main = async () => {
  const rows = parseTemplateRows();
  const subset = limit ? rows.slice(start, start + limit) : rows.slice(start);
  const resumedRows = getResumeRows();
  const processed = resumedRows.length;
  const candidates = [...resumedRows];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (!resume || !fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, `${HEADERS.join(',')}\n`);
  }

  for (let i = processed; i < subset.length; i += 1) {
    const candidate = await buildCandidate(subset[i]);
    candidates.push(candidate);
    fs.appendFileSync(outputPath, `${rowToCsv(candidate)}\n`);
    await sleep(REQUEST_DELAY_MS);
    if ((i + 1) % FLUSH_EVERY === 0 || i === subset.length - 1) {
      console.log(`Progress: ${i + 1}/${subset.length}`);
    }
  }

  const summary = candidates.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${candidates.length} candidate rows to ${outputPath}`);
  console.log(`Range: start=${start} limit=${limit ?? 'ALL'}`);
  console.log(`Resume rows reused: ${processed}`);
  console.log(`Summary: ${JSON.stringify(summary)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
