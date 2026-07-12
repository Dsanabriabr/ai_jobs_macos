# P1 — Search persona & term graph

## Problem validated in P0

Default `ios senior` + `geo_location: United States` produced coherent but **English/US-skewed** results. That matches the adapter, not the candidate.

## Candidate context (product input)

- Brazilian, advanced English → bilingual discovery  
- No US visa → remote / contractor / worldwide first  
- Brazilian company + PJ → international B2B/contractor-friendly roles  

## Strategy

Do **not** hand-maintain a giant static query list forever. Maintain a **weighted term graph** and a **QueryPlanner** that materializes Oxylabs queries.

```text
CandidateProfile + TermGraph
        │
        ▼
   QueryPlanner
        │
        ├─ queries EN/PT
        ├─ boosts (remote, contractor, PJ, …)
        └─ geo rotation (BR, US, EU, …)
        │
        ▼
   JobSearchPort (Oxylabs Web Scraper, then more adapters)
```

## Weight sketch (illustrative)

| Term / phrase | Weight | Role |
|---------------|--------|------|
| ios / swift / uikit / swiftui | high | core skill |
| senior / staff | medium-high | seniority |
| remote / worldwide / anywhere | high | constraint fit |
| contractor / PJ / B2B | high | work model |
| vaga ios / desenvolvedor ios | medium | PT channel |
| H1B / visa sponsorship / relocate to US | negative | mismatch |

Weights are data in `SearchPolicy` / profile — editable later in the menu bar; tunable again in P4 from feedback.

## What stays out of P1

- Cursor ranking / pros-cons (P2)  
- Apply automation (P3)  
- Create ML (P4)  
