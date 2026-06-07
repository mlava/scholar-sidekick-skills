---
name: scholar-sidekick-cli
# prettier-ignore
description: Resolve scholarly identifiers (DOI, PMID, PMCID, ISBN, arXiv, ISSN, ADS bibcode, WHO IRIS URL) into formatted citations (10,000+ CSL styles) and bibliography exports (BibTeX, RIS, EndNote, CSV…), and check retraction, open-access, and citation-fabrication status — from the terminal via the `scholar` CLI. Wraps the public REST API; needs Node ≥20 but no API key for the free tier.
version: 1.0.0
author: Scholar Sidekick
license: MIT
metadata:
  tags: [citations, bibliography, doi, pmid, arxiv, csl, bibtex, ris, retraction, open-access, citation-verification, research, cli, terminal]
  related_skills: [scholar-sidekick-api, scholar-sidekick-mcp, arxiv]
  openclaw:
    emoji: "⌨️"
    homepage: "https://scholar-sidekick.com"
    requires:
      bins: [npx]
---

# Scholar Sidekick (CLI) — Citations, Retraction & Open-Access from the terminal

Turn a scholarly identifier into a formatted citation, a bibliography file, or an integrity
check (retraction / open-access / fabrication) by running the `scholar` command. The CLI is a
thin wrapper over the public Scholar Sidekick REST API. **No API key required** for the free,
rate-limited tier — and ergonomic subcommands mean you don't hand-build JSON request bodies.

> Pick the skill that matches how your agent is wired — all three expose the same capabilities:
> - **`scholar-sidekick-cli`** (this skill): you can run Node ≥20 and prefer typed subcommands,
>   batch input, streaming, and `> file` redirection over crafting `curl` payloads.
> - **`scholar-sidekick-api`**: truly zero-install — the agent already speaks `curl`/HTTP and
>   wants the leanest dependency surface. Start there if you don't want a Node dependency.
> - **`scholar-sidekick-mcp`**: the host has the Scholar Sidekick MCP server connected — native
>   tool calls, no shelling out.

## When to Use
- The user has an identifier (DOI, PMID, PMCID, ISBN, arXiv, ISSN, ADS bibcode, WHO IRIS URL) and wants metadata, a formatted citation, or a bibliography file, **and** the environment has Node ≥20.
- "Cite this in APA/Vancouver/Chicago…", "give me a BibTeX/RIS file", "export these refs to a file".
- "Has this been retracted?", "is this open access?", "is this citation real / did you make it up?"
- Batch jobs: several identifiers at once, or streaming results as they resolve.
- Do NOT use to *search* for papers by topic — that's discovery (see the `arxiv` skill). This assumes you already have an identifier.
- Prefer `scholar-sidekick-api` instead when there is no Node runtime, or `scholar-sidekick-mcp` when an MCP host is connected.

## Install
The CLI ships on npm as `scholar-sidekick-cli` (bin: `scholar`). Requires Node.js ≥ 20.

```bash
# zero-install, per-invocation
npx -y scholar-sidekick-cli format 10.1038/nphys1170 --style apa

# or install globally and call `scholar`
npm install -g scholar-sidekick-cli
scholar health
```
The examples below use `scholar`; substitute `npx -y scholar-sidekick-cli` if you didn't install globally.

## Commands

| Command | What it does | Batch? |
|---|---|---|
| `format <ids...>` | Format identifiers into a citation style. `--style`, `--lang`, `--footnote`, `--output text\|html\|json`. | yes |
| `resolve <ids...>` | Resolve identifiers to bibliographic metadata (CSL/Biblio JSON). | yes |
| `export <ids...>` | Export to a file format: `--format bib\|ris\|csv\|csl\|endnote-xml\|endnote-refer\|refworks\|medline\|zotero-rdf\|txt`. Raw file content on stdout. | yes |
| `format-items` | Format pre-resolved items from `--file <json>` or stdin (a JSON array). | — |
| `stream <ids...>` | Format a batch, streaming each result as NDJSON as it resolves. | yes |
| `verify` | Verify a claimed citation against the record at its identifier. `--title` (required) + an identifier flag (`--doi`, `--pmid`, …). | no |
| `retraction <id>` | Retraction / correction / expression-of-concern status (Crossref / Retraction Watch). Alias context: single id. | no |
| `oa <id>` | Open-access status and best legal copy (Unpaywall). Alias: `open-access`. | no |
| `styles [query]` | List/search available CSL citation styles (paginated). | — |
| `health` | Service liveness and diagnostics. | — |

`format`, `resolve`, `export`, and `stream` accept multiple identifiers (space-, comma-, or
newline-separated). `verify`, `retraction`, and `oa` take a single identifier. Run
`scholar <command> --help` for the full option list.

## Procedure

### Format a citation
```bash
scholar format 10.1038/nphys1170 --style vancouver
scholar format 10.1038/nphys1170 PMID:30049270 --style apa   # batch
```
- `--style`: `vancouver` (default), `ama`, `apa`, `ieee`, `cse`, or any CSL style ID (`chicago-author-date`, `harvard-cite-them-right`, `nature`, `the-lancet`, …). Use `scholar styles <query>` to discover IDs.
- Pass identifiers verbatim — `PMID:`, `arXiv:`, ISBN hyphens, and `https://doi.org/…` are all tolerated.

### Export a bibliography file
```bash
scholar export 10.1038/nphys1170 PMID:30049270 --format ris > refs.ris
```
`export` writes the **raw file content to stdout**, so redirect it straight to a file. Formats:
`bib`, `ris`, `csv`, `csl`, `endnote-xml`, `endnote-refer`, `refworks`, `medline`, `zotero-rdf`, `txt`.

### Check retraction / open access
```bash
scholar retraction 10.1016/S0140-6736(97)11096-0
scholar oa 10.1371/journal.pone.0173664
```
One identifier per call. Books/ISBNs have no DOI, so these report a "no DOI" result.

### Verify a claimed citation (catch fabrication)
```bash
scholar verify --title "The title exactly as cited" --doi 10.1016/S0140-6736(26)00603-3
```
`--title` is required plus an identifier flag. Verdict ∈ `matched` / `mismatch` / `ambiguous` /
`not_found`:
- `mismatch` — identifier resolves but the title doesn't: the dominant AI-fabrication pattern (real DOI + invented title; Topaz et al., Lancet 2026).
- `ambiguous` — identifier resolves to one paper but the claimed title matches a *different* real paper (wrong-identifier error, not fabrication).

Use this for "is this citation real?", not a plain `format`/`resolve`. Add `--fail-on-mismatch`
to make `mismatch`/`not_found` exit non-zero for scripting/CI.

## Output & parsing (for agents)
- Default output is human-readable text. **Pass `--json` to any command** to get the raw API JSON — parse that, don't scrape the pretty text:
  ```bash
  scholar resolve 10.1016/S0140-6736(26)00603-3 --json | jq '.[0].title'
  ```
- A dim provenance footer (request id, cache status, style, version) goes to **stderr**, so it never pollutes piped stdout. Suppress it with `--quiet`. Colour auto-disables off-TTY / with `NO_COLOR` / `--no-color`.

## Authentication & limits
Works **anonymously** at the free, rate-limited tier — fine for normal agent use. To raise limits:
- First-party key (recommended, free): create at https://scholar-sidekick.com/account, prefixed `ssk_`. Pass `--api-key` or set `SCHOLAR_API_KEY`. Sent as `Authorization: Bearer ssk_…`.
- RapidAPI key (paid/managed tiers): `--rapidapi-key` or `RAPIDAPI_KEY` — routes through the RapidAPI gateway, which only exposes `format`, `export`, `verify`, `retraction`, `oa`, `health`. The canonical-only commands (`format-items`, `stream`, `styles`) should run anonymously or with a first-party key.

Other global flags / env: `--base-url` (`SCHOLAR_SIDEKICK_URL`, default `https://scholar-sidekick.com`), `--timeout` (`SCHOLAR_SIDEKICK_TIMEOUT_MS`, default `30000`).

## Exit codes
| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | API error (4xx/5xx), or `verify --fail-on-mismatch` and verdict was `mismatch`/`not_found` |
| `2` | Network failure or timeout |
| `3` | Usage error (bad flags or invalid input) |

Check the exit code; on non-zero, report the failure — **never invent** a citation, retraction status, OA verdict, or a `matched` verdict.

## Pitfalls
- Needs Node ≥20. If unavailable, use the `scholar-sidekick-api` skill (plain `curl`) instead.
- Pass identifiers verbatim; don't strip prefixes.
- `--json` is what you parse; the default text and the stderr footer are for humans.
- `verify`/`retraction`/`oa` are single-identifier; only `format`/`resolve`/`export`/`stream` batch.
- Under a RapidAPI key, `format-items`/`stream`/`styles` aren't available — run those anonymously or with an `ssk_` key.

## Verification
- `scholar health` (or `--json`) returns an `ok: true` payload.
- A good `scholar format … --json` response has a non-empty formatted citation in the JSON.
