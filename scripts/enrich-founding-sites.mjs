import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'research', 'founding-date-template.csv');
const outPath = path.join(root, 'research', 'founding-date-site-candidates.csv');
const args = new Set(process.argv.slice(2));
const REQUEST_TIMEOUT_MS = 20000;
const REQUEST_DELAY_MS = 1200;
const MAX_RETRIES = 2;
const HEADERS = [
  'company',
  'latest_exit_date',
  'deal_type',
  'hq_location',
  'search_query',
  'founding_date',
  'source',
  'confidence',
  'status',
  'page_url',
  'page_title',
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

const decodeHtml = (text) => text
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const stripTicker = (value) => value.replace(/\s+\([^)]+\)$/g, '').trim();
const blockedHost = (url) => /linkedin|crunchbase|pitchbook|facebook|instagram|x\.com|twitter|wikipedia|youtube|tracxn|cbinsights|bloomberg|forbes|yahoo|marketscreener|swfi|owler|craft\.co|theorg/i.test(url);
const officialHostHint = (host) => /investor|ir\.|newsroom|press|media/i.test(host);
const tokenizeCompany = (company) => normalizeWhitespace(stripTicker(company).toLowerCase().replace(/[^a-z0-9 ]/g, ' '))
  .split(' ')
  .filter((token) => token.length >= 3 && !['the', 'and', 'group', 'holdings', 'holding', 'company'].includes(token));
const decodeDuckDuckGoUrl = (url) => {
  const fixed = url.startsWith('//') ? `https:${url}` : url;
  try {
    const parsed = new URL(fixed);
    const uddg = parsed.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : fixed;
  } catch {
    return fixed;
  }
};

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

const fetchText = async (url) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 exits-dash-app founding research',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await sleep((attempt + 1) * 2500);
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

const searchQueryFor = (row) => {
  const company = stripTicker(row.company).replace(/^"+|"+$/g, '');
  return `"${company}" official site founded about story`;
};

const scoreResult = (company, url, title) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const tokens = tokenizeCompany(company);
    const hostText = host.replace(/^www\./, '').replace(/[-.]/g, ' ');
    const titleText = title.toLowerCase();
    let score = 0;

    for (const token of tokens) {
      if (hostText.includes(token)) score += 30;
      if (titleText.includes(token)) score += 10;
      if (path.includes(token)) score += 5;
    }

    if (/about|our-story|story|company|history|who-we-are/.test(path)) score += 15;
    if (officialHostHint(host)) score += 10;
    if (/news|press|media/.test(path)) score += 5;

    return score;
  } catch {
    return 0;
  }
};

const parseDuckDuckGoResults = (html, company) => {
  const results = [];
  const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(html))) {
    const url = decodeDuckDuckGoUrl(decodeHtml(match[1]));
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, ' ')).trim();
    if (!url || blockedHost(url)) continue;
    const score = scoreResult(company, url, title);
    if (score <= 0) continue;
    results.push({ url, title, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 3);
};

const parseFoundingFromPage = (html) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].replace(/\s+/g, ' ').trim()) : '';
  const text = decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const patterns = [
    { re: /\bfounded in (\d{4})\b/i, confidence: 'MEDIUM' },
    { re: /\bsince (\d{4})\b/i, confidence: 'LOW' },
    { re: /\bestablished in (\d{4})\b/i, confidence: 'MEDIUM' },
    { re: /\bcompany founded in (\d{4})\b/i, confidence: 'MEDIUM' },
    { re: /\bfounded in ([A-Z][a-z]+ \d{4})\b/i, confidence: 'MEDIUM_HIGH' },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.re);
    if (!match) continue;
    const raw = match[1];
    let foundingDate = raw;
    if (/^[A-Z][a-z]+ \d{4}$/.test(raw)) {
      const [month, year] = raw.split(' ');
      const monthNum = new Date(`${month} 1, ${year} UTC`).getUTCMonth() + 1;
      foundingDate = `${year}-${String(monthNum).padStart(2, '0')}`;
    }
    return {
      founding_date: foundingDate,
      confidence: pattern.confidence,
      title,
      notes: `Extracted from site text: ${match[0]}`,
    };
  }

  return { founding_date: '', confidence: 'LOW', title, notes: 'No founding text extracted from page' };
};

const buildCandidate = async (row) => {
  const searchQuery = searchQueryFor(row);
  try {
    await sleep(REQUEST_DELAY_MS);
    const searchHtml = await fetchText(`https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`);
    const results = parseDuckDuckGoResults(searchHtml, row.company);
    if (!results.length) {
      return {
        ...row,
        search_query: searchQuery,
        founding_date: '',
        source: 'Official site search',
        confidence: 'NONE',
        status: 'NO_SEARCH_RESULT',
        page_url: '',
        page_title: '',
        notes: 'No suitable search result found',
      };
    }

    for (const result of results) {
      try {
        await sleep(REQUEST_DELAY_MS);
        const pageHtml = await fetchText(result.url);
        const parsed = parseFoundingFromPage(pageHtml);
        if (parsed.founding_date) {
          return {
            ...row,
            search_query: searchQuery,
            founding_date: parsed.founding_date,
            source: 'Official site heuristic',
            confidence: parsed.confidence,
            status: 'SITE_MATCH',
            page_url: result.url,
            page_title: parsed.title || result.title,
            notes: `${parsed.notes}; result_score=${result.score}`,
          };
        }
      } catch (error) {
        continue;
      }
    }

    return {
      ...row,
      search_query: searchQuery,
      founding_date: '',
      source: 'Official site heuristic',
      confidence: 'LOW',
      status: 'MATCH_NO_DATE',
      page_url: results[0].url,
      page_title: results[0].title,
      notes: `Search found plausible site, but no founding language was extracted; result_score=${results[0].score}`,
    };
  } catch (error) {
    return {
      ...row,
      search_query: searchQuery,
      founding_date: '',
      source: 'Official site search',
      confidence: 'ERROR',
      status: 'ERROR',
      page_url: '',
      page_title: '',
      notes: error instanceof Error ? error.message : String(error),
    };
  }
};

const main = async () => {
  const rows = parseTemplateRows().filter((row) => !/\([A-Z]{2,5}:\s*[A-Z.\-]+\)$/.test(row.company));
  const subset = limit ? rows.slice(start, start + limit) : rows.slice(start);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${HEADERS.join(',')}\n`);
  const results = [];

  for (let i = 0; i < subset.length; i += 1) {
    const result = await buildCandidate(subset[i]);
    results.push(result);
    fs.appendFileSync(outputPath, `${HEADERS.map((header) => csvEscape(result[header] ?? '')).join(',')}\n`);
    if ((i + 1) % 5 === 0 || i === subset.length - 1) {
      console.log(`Progress: ${i + 1}/${subset.length}`);
    }
  }

  const summary = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${results.length} site candidate rows to ${outputPath}`);
  console.log(`Range: start=${start} limit=${limit ?? 'ALL'}`);
  console.log(`Summary: ${JSON.stringify(summary)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
