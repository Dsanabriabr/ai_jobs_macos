# P1.2 — Dual discovery & configurable sources

## Feedback validated (P1.1)

| Feedback | Diagnosis |
|----------|-----------|
| Cadence / filters / labels OK | Keep |
| “Se é só Gupy, não tem duplicata” | Correto: `duplicate` faz sentido **entre fontes**, não dentro do mesmo ATS id |
| “Só parece Gupy” | Planner faz `unshift` de `site:gupy.io` + denylist mata boards; orçamento de queries esgota em ATS BR |
| Preferência ATS estática | `HostPolicy` + queries hardcoded → resultado tendencioso e estável demais |
| Precisa superfície + ATS + cruzamento | Hoje só SERP (com bias `site:`); sem resolução superfície→ATS |
| Só ~10 vagas | Não é paginação de UI. É **limite de discovery**: `resultLimitPerQuery` default 8, Oxylabs ~10 organics/página, **sem** `start_page`/`pages`, `maxPlannedQueries` 6 com overlap |

## Target architecture

```text
SearchPolicy.sources (editável)
  atsTargets[]     — gupy, greenhouse, … (on/off, weight)
  surfaceEnabled   — Google SERP sem site: obrigatório
  budget           — % surface vs % ats vs % follow
        │
        ▼
QueryPlanner
  lane A: surface queries (diversas, anti-agregador)
  lane B: ATS-targeted (site: ou URL de search do ATS)
  lane C: follow/resolve (opcional) — abrir listing de superfície → extrair ATS apply URL
        │
        ▼
SignalPipeline
  fingerprint merge across lanes
  prefer canonical ATS when mirror exists
  Dup button = cross-source only (UI hint)
```

## P1.2 scope

1. **`SourcePolicy` no `SearchPolicy`** (não hardcoded)
   - lista de ATS com `enabled`, `weight`, `siteOperator` / `searchUrlTemplate`
   - denylist ainda existe, mas ATS preferidos são **dados de policy**, editáveis na UI
2. **Dual lanes no planner**
   - budget configurável, ex.: `surface: 0.4`, `ats: 0.5`, `follow: 0.1`
   - superfície sem `site:gupy` forçado; ATS lane usa só targets enabled
3. **Volume / paginação Oxylabs**
   - `pages` / `start_page` no adapter
   - `resultLimitPerQuery` + `maxPagesPerQuery` na policy
   - UI: “Max results / pages” explícito (hoje parece “só 10 vagas no produto”)
4. **Follow/resolve (MVP)**
   - para N hits de superfície (company career page), 1 scrape `universal` para achar link ATS
   - cruzar com fingerprint (validação, não segunda lista cega)
5. **Semântica de Dup**
   - esconder/desabilitar Dup quando `mirrors.length == 1` e `hostKind == ats`
   - journal `duplicate` só quando há espelho cross-host

## Out of P1.2

- Cursor ranking (P2)
- Apply automation (P3)
- Create ML (P4)
- Login LinkedIn / scraping autenticado
