---
name: scholar-sidekick-python
# prettier-ignore
description: Resolve scholarly identifiers (DOI, PMID, PMCID, ISBN, arXiv, ISSN, ADS bibcode, WHO IRIS URL) into formatted citations (10,000+ CSL styles) and bibliography exports (BibTeX, RIS, EndNote, CSV…), verify a claimed citation against the record its identifier actually resolves to, and audit a reference list of any length for fabricated and retracted entries — from Python via the `scholar-sidekick` package. Wraps the public REST API; needs Python ≥3.9 but no API key for the free tier. Use when the agent runs Python (a script, a notebook, a data pipeline) and the user wants to cite, export, verify, or audit references by DOI, PMID, PMCID, ISBN, arXiv ID, ISSN, ADS bibcode, or WHO IRIS URL — especially a bibliography longer than 25 entries, which this client chunks and paces automatically.
version: 1.0.0
author: Scholar Sidekick
license: MIT
metadata:
  tags: [citations, bibliography, doi, pmid, arxiv, csl, bibtex, ris, retraction, citation-verification, research, python, pandas, notebook, systematic-review]
  related_skills: [scholar-sidekick-api, scholar-sidekick-cli, scholar-sidekick-mcp]
  openclaw:
    emoji: "🐍"
    homepage: "https://scholar-sidekick.com"
    requires:
      bins: [python3]
---

# Scholar Sidekick (Python) — Cite, verify and audit citations from Python

Turn a scholarly identifier into a formatted citation, a bibliography file, or a fabrication
check, using the `scholar-sidekick` package. It is a thin, typed client over the public Scholar
Sidekick REST API. **No API key required** for the free, rate-limited tier. Results come back as
objects, so you never parse text output.

> Sibling skills, same API underneath: use **`scholar-sidekick-api`** when the agent only has
> `curl`, **`scholar-sidekick-cli`** for a Node ≥20 terminal, or **`scholar-sidekick-mcp`** when an
> MCP host is connected. This skill is the Python path.

## When to Use
- The agent runs Python — a script, a notebook, or a data pipeline — and the user has an identifier
  (DOI, PMID, PMCID, ISBN, arXiv, ISSN, ADS bibcode, WHO IRIS URL).
- "Is this citation real / did you make it up?" — `verify()` compares the claimed title against the
  record the identifier resolves to.
- "Check every reference in this list" — **especially a list longer than 25 entries.**
  `audit_bibliography()` chunks and paces itself; hand-rolled loops hit the rate limit.
- The result feeds further Python work: a DataFrame, a report, a CI gate.
- Do NOT use this to *search* for papers by topic. That is discovery; this assumes you already
  have an identifier.

**This client does not cover everything the REST API does.** There is no standalone retraction
check, no open-access check, no style search, and no bare identifier resolution. For those, use the
`scholar-sidekick-api` or `scholar-sidekick-cli` skill. Retraction screening *is* available, but
only inside an audit.

## Install
Published on PyPI as `scholar-sidekick` (import name `scholar_sidekick`). Requires Python ≥ 3.9.

```bash
pip install scholar-sidekick
pip install 'scholar-sidekick[pandas]'   # adds report.to_dataframe()
```

## API surface

| Method | Purpose | Returns |
|---|---|---|
| `format()` | Resolve identifiers and format them | `FormatResult` (`.text`, `.html`) |
| `format_items()` | Format already-resolved CSL-JSON items | `FormatItemsResult` (`.output`) |
| `export()` | Export to a bibliography file format | `str` — the file body |
| `verify()` | Check one claimed citation against the resolved record | `VerifyResult` |
| `audit()` | Audit up to 25 references in one call | `AuditReport` |
| `audit_bibliography()` | Audit any number, chunked and paced | `AuditReport` |
| `health()` | Service liveness | `dict` |

`AsyncScholarSidekick` mirrors every method; only the awaiting differs.

## Procedure

### Verify one citation (catch fabrication)
```python
from scholar_sidekick import ScholarSidekick

client = ScholarSidekick()

result = client.verify(
    title="Quantum entanglement in biological systems",
    doi="10.1038/nphys1170",
)
print(result.verdict, result.confidence)
```

`title` is required, plus at least one identifier keyword (`doi`, `pmid`, `pmcid`, `isbn`,
`arxiv`, `issn`, `ads`, `who_iris_url`). Optional: `authors`, `year`, `container`.

| verdict | meaning |
|---|---|
| `matched` | the claimed citation agrees with the resolved record |
| `mismatch` | the identifier resolves to a **different** work — the dominant fabrication pattern (real DOI, invented title; Topaz et al., Lancet 2026) |
| `ambiguous` | a discrepancy a human should read; not an accusation |
| `not_found` | no record found in the registries searched |

Two rules that matter:
- A `mismatch` is **returned as a value, never raised.** It is the expected outcome for a
  fabricated citation, and the reason this method exists.
- `not_found` is **not** proof of fabrication. Standards documents, software repositories, model
  cards and institutional reports are often real but absent from scholarly registries. Report it as
  "could not confirm".

Do not use `format()` to answer "is this real?". A fabricated citation carries a real, resolvable
DOI, so formatting it succeeds and proves nothing. Only `verify()` compares the claimed title.

### Audit a whole bibliography
```python
claims = [
    {"title": "Attention is all you need", "arxiv": "1706.03762"},
    {"title": "Ileal-lymphoid-nodular hyperplasia…", "doi": "10.1016/S0140-6736(97)11096-0"},
    # …any number of entries
]

report = client.audit_bibliography(
    claims,
    progress=lambda done, total: print(f"{done}/{total} chunks"),
)

print(report.summary)          # total / matched / mismatch / ambiguous / not_found / errored / retracted
for entry in report.needs_review:
    print(entry.input_index, entry.verdict, entry.claimed_title, entry.resolved_title)
```

- **`entry.input_index` is the 0-based position in the list you passed in**, whatever the chunking
  did. Use it to point at the right reference.
- Each entry also carries `retracted`, `has_concern`, `has_corrections`, and `notices` — retraction
  screening is **on by default**. Pass `checks=[]` to skip it. `"retraction"` is the only accepted
  check value.
- A failed chunk is recorded, not raised, so one transient upstream error does not discard several
  minutes of completed work:

```python
if not report.complete:
    for failure in report.errors:
        print(f"entries {failure.start_index}-{failure.end_index} failed: {failure.error}")
```

Pass `stop_on_error=True` to raise on the first failed chunk instead.

**Claim dicts are strict — the server rejects unknown keys.** Allowed: `title`, `authors`
(`[{"family": …, "given": …}]`, max 50), `year` (int), `container`, and the identifiers `doi`,
`pmid`, `pmcid`, `isbn`, `arxiv`, `issn`, `ads`, `whoIrisUrl` (note the camelCase). Strip anything
else before sending.

**Two input kinds, and the wrong one fails.** Default `kind="claims"` expects dicts. For raw prose
reference strings — a pasted reference list with no parsed title — pass `kind="references"`, which
verifies by containment instead of title comparison:

```python
report = client.audit_bibliography(reference_strings, kind="references")
```

With pandas installed: `report.to_dataframe()`.

Use `audit()` instead of `audit_bibliography()` only when you have 25 entries or fewer *and* want a
single call. `audit()` also accepts a raw `bibliography=` string (BibTeX / RIS / CSL-JSON) which
the server parses; pass `format=` to override auto-detection.

This audits citation **identity**. It does not check whether a source supports the claim it is
cited for.

### Format and export
```python
print(client.format(text="10.1038/nphys1170", style="vancouver").text)

with open("refs.bib", "w") as fh:
    fh.write(client.export(text="10.1038/nphys1170 PMID:30049270", format="bibtex"))
```

- `format()` takes exactly one of `text=` (a blob the API detects identifiers in) or
  `lines=` (a sequence). Passing both, or neither, raises `ValueError`.
- `style`: `vancouver` (default), `ama`, `apa`, `ieee`, `cse`, or any CSL style ID
  (`chicago-author-date`, `nature`, `the-lancet`, …).
- `export()` formats: `bibtex`, `ris`, `csv`, `csl`, `endnote-xml`, `endnote-refer`, `refworks`,
  `medline`, `zotero-rdf`, `txt`. It returns the file body as a string — write it yourself.

## Errors
Exceptions are chosen by the API's stable error `code`, not by HTTP status.

```python
from scholar_sidekick import APIError, RateLimitError, UpstreamError

try:
    client.format(text="10.1038/nphys1170")
except RateLimitError as exc:
    print("retry after", exc.retry_after)
except UpstreamError as exc:
    print("a data source failed:", exc.code)
except APIError as exc:
    print(exc.code, exc.message, exc.request_id)
```

| Exception | When |
|---|---|
| `ValidationError` | the request was malformed or invalid |
| `AuthError` | authentication or entitlement was refused |
| `RateLimitError` | rate limit exceeded; carries `.retry_after` |
| `UpstreamError` | a data source failed after the API's own retries |
| `TransportError` | connection failure or timeout; no HTTP response |

Every `APIError` carries `.request_id`. Include it when reporting a problem.

**On any exception, report the failure.** Never invent a citation, a retraction status, or a
`matched` verdict the client did not return.

## Authentication and limits
Works **anonymously** at the free, rate-limited tier — fine for normal agent use. A key raises the
limit about fivefold but is never required:

```python
client = ScholarSidekick(api_key="ssk_…")
```

Precedence: the explicit argument, then `SCHOLAR_SIDEKICK_API_KEY`, then anonymous. Free keys come
from <https://scholar-sidekick.com/account>. Other constructor options: `base_url`, `timeout`
(30 s), `connect_timeout` (10 s), `max_retries` (2). `SCHOLAR_SIDEKICK_BASE_URL` overrides the host.

Both clients close cleanly as context managers:

```python
with ScholarSidekick() as client:
    ...

async with AsyncScholarSidekick() as client:
    result = await client.verify(title="…", doi="10.1038/nphys1170")
```

## Pitfalls
- **No `resolve()`, no retraction method, no open-access method, no style search.** Only the seven
  methods above exist. Use the `scholar-sidekick-api` or `-cli` skill for the rest.
- `format()` returns **whole-batch** `.text`/`.html` covering every input, newline-joined — not one
  string per item. Do not split it to synthesise per-item citations; styles put newlines inside
  entries. `format_items()` names the same string `.output`, deliberately.
- `AuditEntry` has **`claimed_title` and `resolved_title`**, not `.title`.
- `kind="claims"` needs dicts; raw strings need `kind="references"`.
- `audit()` requires exactly one of `bibliography=`, `claims=`, or `references=` — it raises
  `ValueError` locally rather than spending a round trip.
- `audit_bibliography()` sends chunks **serially even in the async client**. That is deliberate:
  the constraint is the server's upstream budget, not local concurrency. Do not parallelise it.
- Pass identifiers verbatim. `PMID:`, `arXiv:`, ISBN hyphens and `https://doi.org/…` are all
  tolerated.

## Verification
```python
from scholar_sidekick import ScholarSidekick

client = ScholarSidekick()
assert client.health().get("ok") is True

# A real DOI with a deliberately wrong title must come back `mismatch`.
print(client.verify(title="A title this paper does not have",
                    doi="10.1038/nphys1170").verdict)
```
