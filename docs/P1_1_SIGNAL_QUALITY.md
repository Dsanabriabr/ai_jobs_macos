# P1.1 — Signal quality

## Problem

Google SERP returns **links about jobs** (ZipRecruiter, Apple careers hubs, mirrors) and the same vacancy across LinkedIn / Glassdoor / Gupy / etc.

## Approach

1. Drop denylisted aggregator hosts early  
2. Prefer ATS URLs as canonical  
3. Fingerprint merge → one `JobOpportunity` with `mirrors[]`  
4. Human labels (`signal` / `noise` / `duplicate`) into `feedback.jsonl`  
5. Filters in UI; cadence picker for daily/weekly runs  

Create ML stays in P4; this phase **builds the labeled corpus**.
