# P1.4 — Clean posting list (gate before P2)

## Intent

Stop treating SERP/hub links as jobs. Build a **clean posting list** with human enrichment (company, title, URL, **logo URL**) before any Cursor spend.

## Taxonomy

| Kind | Meaning | UI |
|------|---------|-----|
| `posting` | Single apply-able job | Eligible for **Signal** |
| `hub` | Search/list/careers index | Button **Hub** — not signal |
| `unknown` | Unclear | Needs user / follow |

**Signal** is only valid when `pageKind == posting`.

A job-board *listing page* is **hub**, not signal — jobs live inside it.

## Human enrichment (training)

Per cell, user can edit and persist:

- company  
- title  
- url (canonical apply link)  
- **logoUrl** (company logo image URL)  

Logo shows on the **left** of the cell. Empty → placeholder.

Edits + labels survive re-runs (`enrichedByUser`).

## Default list

Filter default: **`postings`** (hide hubs).  
Also: signal / hubs / unlabeled / hide_noise / all.

## P2 gate

Cursor only on `signal` + `pageKind=posting` + company filled (enforced later in P2).
