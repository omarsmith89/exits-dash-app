# Founding Date Workflow

## What Lives Where

- `public/company_founding_dates.csv`
  - Verified founding or incorporation dates keyed by exact company name from the dashboard dataset.
- `research/founding-date-template.csv`
  - Generated work queue of companies that still need founding-date enrichment.
- `research/founding-date-candidates.csv`
  - Machine-generated founding-date candidates for the missing companies. These are review inputs, not automatically trusted truth.

## CSV Schema

`public/company_founding_dates.csv` columns:

- `company`
- `founding_date`
- `date_basis`
- `source`
- `confidence`
- `notes`

Accepted `founding_date` formats:

- `YYYY-MM-DD`
- `YYYY-MM`
- `YYYY`

The dashboard interprets partial dates conservatively using the first day of the month or year when calculating time to exit.

Accepted `date_basis` values:

- `operating_founding`: earliest credible date the operating business was founded.
- `legal_incorporation`: incorporation date that appears to describe the original operating company rather than a later issuer shell.
- `issuer_incorporation_review`: possible holding-company, SPAC, reorganization, successor, or public issuer date. Keep visible for review, but do not use for the operating-age filter.
- `exclude_from_time_to_exit`: known non-operating date that should stay out of time-to-exit analysis.

## Recommended Research Order

1. Official company about/history page or prospectus language stating when the operating business was founded
2. SEC filing or company registry incorporation date, only when it appears to describe the original operating company
3. Other primary source such as an investor relations page or prospectus
4. Secondary source only when clearly attributed
5. LinkedIn only as a fallback

## Refresh Workflow

1. Run `npm run founding:template`
2. Run `npm run founding:candidates`
3. Run `npm run founding:promotion-review`
4. Review high-confidence rows in `research/revisit-lists/founding-promotion-review.csv`
5. Move approved rows into `public/company_founding_dates.csv` with a reviewed `date_basis`
6. Rebuild the app

## Bulk Candidate Generator

`npm run founding:candidates` uses Wikidata as a first-pass structured source across the full missing-company list.

You can run it in batches if you do not want one long network pass:

- `node scripts/enrich-founding-candidates.mjs --start=0 --limit=250 --out=research/founding-date-candidates-0000.csv`
- `node scripts/enrich-founding-candidates.mjs --start=250 --limit=250 --out=research/founding-date-candidates-0250.csv`

There is also a batch orchestrator:

- `npm run founding:batches`

Useful variants:

- `node scripts/run-founding-batches.mjs --batch-size=100`
- `node scripts/run-founding-batches.mjs --start=500 --limit=500 --batch-size=50`

Each batch writes its own resumable CSV into `research/founding-batches/`.

What it gives you:

- a candidate `founding_date`
- a candidate `date_basis` of `operating_founding`
- a `wikidata_id`
- a rough confidence score
- notes about country and alias matching

What it does not guarantee:

- exact legal-entity matching
- correctness for ambiguous names
- coverage for private companies that are poorly represented in Wikidata

Recommended usage:

1. Run `npm run founding:template`
2. Run `npm run founding:candidates`
3. Sort `research/founding-date-candidates.csv` by `status` and `score`
4. Move `LIKELY_MATCH` rows first
5. Manually review `REVIEW` rows
6. Leave `NO_MATCH`, `NO_INCEPTION`, and `ERROR` rows for deeper research

## SEC Fallback Pass

`npm run founding:sec` is a stronger second source for public-company rows that include exchange tickers in the dataset.

What it does:

- matches rows to SEC issuers by ticker first, then normalized company name
- pulls recent filings from SEC submissions JSON
- prioritizes forms like `S-1`, `F-1`, `10-K`, `20-F`, and `8-K`
- extracts phrases like `incorporated on ...`, `incorporated in ...`, or `founded in ...`
- tags `founded` phrases as `operating_founding` and `incorporated` phrases as `legal_incorporation`

Recommended ordering:

1. SEC pass for rows with public tickers
2. Wikidata pass for the broader long tail
3. Official company-site fallback for unresolved rows

## Official-Site Fallback

`npm run founding:sites` is a heuristic fallback for non-public or unresolved companies.

What it does:

- searches the web for `"<company>" official site founded`
- avoids obvious non-primary hosts like LinkedIn, Crunchbase, and Wikipedia
- visits likely company pages and looks for phrases like `founded in`, `established in`, or `since`

Tradeoffs:

- stronger coverage potential than Wikidata for private companies
- noisier than SEC
- requires review because search-engine and page-text matching are heuristic

## Promotion Review

`npm run founding:promotion-review` combines SEC, Wikidata, and official-site batch output into `research/revisit-lists/founding-promotion-review.csv`.

It does not update the live dashboard data. It ranks rows as:

- `PROMOTE_CANDIDATE`: likely operating founding date, ready for quick review.
- `REVIEW`: useful candidate, but legal/incorporation basis or suspiciously short age needs human review.
- `SKIP`: no usable date or weak status.

The review step is where we prevent holding-company, SPAC, issuer, and reorganization incorporation dates from becoming fake "fast exits."

## Current Behavior In The App

- `Time to Exit (Operating Age)` is off by default.
- Once you enter a min or max, the app filters only to deals with reviewed operating-age dates in `public/company_founding_dates.csv`.
- Coverage shown in the filter bar is based on the current non-time-filter scope.
