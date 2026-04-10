# Founding Date Sample For Time-To-Exit

Small proof-of-concept sample taken from companies already present in the dashboard dataset.

## Sample Results

| Company | Exit date in dataset | Exit type | Best founding date found | Source type | Notes on confidence | Approx. time to exit |
| --- | --- | --- | --- | --- | --- | --- |
| 1stDibs | 2021-06-10 | IPO | 2000-03-10 | SEC filing | High. SEC filing states the company was incorporated on March 10, 2000. | ~21.3 years |
| 23andMe Holding | 2021-06-10 | Reverse Merger | 2006 | SEC filing / company press materials | Medium-high. Primary sources consistently say founded or incorporated in 2006, but the exact month/day was not confirmed in the quick sample. | ~15 years |
| SentinelOne | 2021-06-30 | IPO | 2013-01 | SEC filing | High. SEC filing states the company was incorporated in January 2013. | ~8.5 years |
| Rubrik | 2024-04-25 | IPO | 2013-12 / 2014-01 | SEC filing / official company history | High. SEC says incorporated in December 2013; Rubrik's own history says founded in 2014. This is a good example of incorporation date vs. operating founding date diverging slightly. | ~10.3 years from incorporation, ~10.0 years from operational founding |
| Figma | 2025-07-31 | IPO | 2012-10-19 | SEC filing | High. SEC materials state Figma was originally incorporated on October 19, 2012. | ~12.8 years |

## Takeaways

- SEC filings are the best first source for public companies in this dataset.
- "Founded" and "incorporated" are often close but not always identical.
- LinkedIn does not look necessary for this sample and would likely be weaker and slower.
- If we want consistency, we should decide whether time to exit means:
  - legal age at exit, based on incorporation date; or
  - operating age at exit, based on the earliest credible "founded" date.

## Recommended Rule For A Larger Pilot

1. Use exact incorporation date from SEC or company registry when available.
2. If exact incorporation date is unavailable, use official company "founded in YEAR" language.
3. Store both the date and the source.
4. Mark rows with year-only dates so we can show them as approximate.
