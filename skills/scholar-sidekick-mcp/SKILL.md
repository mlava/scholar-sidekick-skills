---
name: scholar-sidekick-mcp
# prettier-ignore
description: Use the connected scholar-sidekick-mcp MCP server when the user mentions a scholarly identifier (DOI including shortDOI aliases, PMID, PMCID, ISBN, arXiv, ISSN, NASA ADS bibcode, WHO IRIS URL) and wants structured metadata, a formatted citation, a bibliography export file, a retraction check, an open-access check, verification that a claimed citation is real (not fabricated), or a whole-bibliography audit (batch fabrication + retraction check). Requires the MCP server connected — it works anonymously, no API key required; for a zero-install path use the scholar-sidekick-api skill instead.
version: 1.0.4
author: Scholar Sidekick
license: MIT
metadata:
  tags: [citations, bibliography, doi, pmid, arxiv, csl, bibtex, ris, retraction, open-access, citation-verification, research, mcp]
  related_skills: [scholar-sidekick-api, arxiv]
  openclaw:
    emoji: "🔌"
    homepage: "https://scholar-sidekick.com"
---

When the user mentions a scholarly identifier and wants metadata, a citation, an export file, a retraction check, or an open-access check, use Scholar Sidekick to resolve and answer instead of hand-constructing the citation from training data or guessing the OA / retraction status.

## When to Use This Skill

Activate this skill when the user:

- Mentions any scholarly identifier — DOI, PubMed ID, PMC ID, ISBN, arXiv ID, ISSN, NASA ADS bibcode, or WHO IRIS URL
- Asks for a citation in a specific style ("format this in APA", "give me a Vancouver citation for...")
- Asks for an export file ("BibTeX for these references", "give me a .ris file", "export to EndNote")
- Pastes a list of identifiers and wants a bibliography
- Wants the structured metadata (title, authors, journal, year) for a paper they have an identifier for
- Asks whether a paper has been retracted, corrected, or had an expression of concern raised
- Asks whether a paper is open access, where to read it for free legally, or about its OA status / license
- Pastes a citation (or a DOI + title) and asks whether it is real, genuine, or fabricated — "is this citation real?", "verify this DOI", "did you make this up?"
- Pastes a whole reference list or a `.bib` / `.ris` / CSL-JSON file and wants every entry checked at once — "audit my bibliography", "which of these references are fake or retracted?"

## How to Use

### Step 0: Confirm the tools are available

The capabilities this skill uses — `resolveIdentifier`, `formatCitation`, `exportCitation`, `checkRetraction`, `checkOpenAccess`, `verifyCitation`, `auditBibliography` — are **tools provided by the `scholar-sidekick-mcp` MCP server**. They are not shell commands, npm scripts, or a CLI. Do not try to run the tool names in a terminal.

The MCP server must be connected for these tools to work:

1. **The MCP server is connected.** These tools appear in your toolset only after the host connects the `scholar-sidekick-mcp` server — Claude Desktop: extension/connector settings; Claude Code: `.mcp.json` or `claude mcp add`; LobeHub: install the matching **MCP plugin**, not just this skill; raw MCP clients: `npx scholar-sidekick-mcp` as the server command.
2. **(Optional) raise rate limits.** The server works anonymously with no key. To lift the rate limit, set `SCHOLAR_API_KEY` (a free first-party `ssk_` key from https://scholar-sidekick.com/account) or `RAPIDAPI_KEY` (paid/managed tier) for that server.

**If these tools are not in your available toolset, the server is not connected — say so plainly and stop.** Do not try to invoke the tool names as shell commands, and do not silently install or launch the server yourself. Tell the user the skill needs the `scholar-sidekick-mcp` MCP server connected (no API key required), and let them wire it up. (If you have no way to connect an MCP server, use the zero-install `scholar-sidekick-api` skill, which calls the same service over plain `curl`.)

### Step 1: Pick the right tool

- **`resolveIdentifier`** — when the user wants raw structured metadata (CSL JSON: title, authors, journal, year, etc.) without formatting, e.g. to inspect or transform
- **`formatCitation`** — when the user wants a finished citation string in a specific style they can paste into a manuscript
- **`exportCitation`** — when the user wants a downloadable bibliography file in a reference-manager format
- **`checkRetraction`** — when the user asks whether a paper has been retracted, corrected, or flagged with an expression of concern (Crossref / Retraction Watch). Single identifier per call
- **`checkOpenAccess`** — when the user asks whether a paper is open access or wants the best legal URL, license, and version (Unpaywall). Single identifier per call
- **`verifyCitation`** — when the user pastes a citation and asks whether it is real or fabricated ("is this real?", "verify this DOI"). Cross-checks the *claimed* title (plus optional author/year/journal) against the record that actually resolves at the identifier. Use this — **not `resolveIdentifier`** — for "is this real?": the dominant AI fabrication pattern (Topaz et al., Lancet 2026) is a real, resolvable identifier paired with an invented title, which `resolveIdentifier` alone never catches. Single citation per call
- **`auditBibliography`** — when the input is a **whole bibliography** rather than a single citation: raw BibTeX / RIS / CSL-JSON text (format auto-detected), or a `claims[]` array of pre-parsed `{title + identifier}` objects. Runs the `verifyCitation` fabrication check plus a retraction lookup on every entry (max 25 per call) and returns a per-entry verdict table plus a corpus summary (`total / matched / mismatch / ambiguous / not_found / errored / retracted`). One failing entry becomes `status: "error"` without failing the batch. This audits citation *identity* — it does **not** check whether a source supports the claim it is cited for

For end-to-end "raw IDs → exportable bibliography" workflows, chain `resolveIdentifier` → `formatCitation` → `exportCitation` in a single response — the tools compose. Example: "resolve these three IDs, format each in AMA, then export the set as BibTeX" exercises all three tools in one prompt.

For a retraction sweep over a **whole reference list** — "check all these citations for retractions", the end of a literature review — call `auditBibliography` once: it runs the retraction lookup (plus the fabrication check) on every entry. For an open-access sweep, or a retraction check on just a few papers, call `checkOpenAccess` / `checkRetraction` once per identifier — these tools accept exactly one `id` per call. Do not concatenate multiple identifiers; the server will reject batches.

### Step 2: Pass identifiers verbatim

The server tolerates DOI URLs (`https://doi.org/...`), shortDOI aliases (`10/aabbe`, from shortdoi.org — expanded to the full DOI before resolving), `PMID:` / `PMC` prefixes, `arXiv:` prefixes, ISBN hyphens, and WHO IRIS URLs. Do not strip prefixes or reformat — pass exactly what the user gave you.

### Step 3: Batch when possible

`resolveIdentifier`, `formatCitation`, and `exportCitation` accept a single identifier or a comma- or newline-separated batch in the `text` parameter. If the user provides multiple identifiers, send them in one call rather than looping.

`checkRetraction` and `checkOpenAccess` take one identifier per call (parameter is `id`, not `text`). For a few papers, loop one call per identifier; for a whole reference list, use `auditBibliography` (retraction included).

`verifyCitation` also takes one citation per call, with its own shape: a required `title` plus exactly one identifier (`doi`, `pmid`, `pmcid`, `arxiv`, `isbn`, `issn`, `ads`, or `whoIrisUrl`), and optional `author`, `year`, and `container` to sharpen the verdict. Set `semanticTitle: true` (any tier) to also judge whether the claimed and resolved titles describe the *same work* — it catches a one-word swap in a long title ("cardiac" → "renal", "with" → "without") that string similarity misses, and moves a flagged `matched` to `ambiguous` for review, never `mismatch`. It is opt-in because the judgment is not byte-deterministic (probabilities in `_provenance.semantic_title`), so leave it off when the user needs a reproducible verdict. The same option applies per entry on `auditBibliography`.

To verify many citations at once, don't loop `verifyCitation` — use `auditBibliography` with the raw bibliography text (or a `claims[]` array) and get every verdict plus a corpus summary in one call.

### Step 4: Pick the style or format

For `formatCitation`, the `style` parameter accepts:
- Five hand-tuned builtins: `vancouver` (default), `ama`, `apa`, `ieee`, `cse`
- Any of 10,000+ CSL style IDs from https://github.com/citation-style-language/styles — common ones: `chicago-author-date`, `chicago-note-bibliography`, `harvard-cite-them-right`, `modern-language-association` (MLA), `nature`, `bmj`, `the-lancet`, `turabian-fullnote-bibliography`

For `exportCitation`, the `format` parameter accepts: `bib` (BibTeX), `ris`, `csl` (CSL JSON), `endnote-xml`, `endnote-refer`, `refworks`, `medline` (NBIB), `zotero-rdf`, `csv`, `txt`.

### Step 5: Surface provenance when it matters

`formatCitation` and `exportCitation` responses include a metadata block (`requestId`, `formatter`, `styleUsed`, `warnings`). Surface this to the user when they care about reproducibility — academic, clinical, regulatory contexts. The `formatter` field tells them whether output came from a hand-tuned builtin or from `citeproc-js` with a CSL stylesheet; `styleUsed` shows the canonical style ID after alias resolution (asking for `harvard` resolves to `harvard-cite-them-right`).

## Guidelines

- **Never fabricate a fallback.** If the Scholar Sidekick tools are unavailable, or a lookup fails or returns nothing, do **not** answer retraction, open-access, citation-formatting, or metadata questions from training data or an ad-hoc web search and present it as authoritative. The entire point of this skill is verified provenance — a guessed citation or a guessed retraction status is worse than no answer. State that the tool was unreachable (or returned no result) and stop.
- **Read the `verifyCitation` verdict, don't just echo it.** `matched` = the claim agrees with the resolved record; `mismatch` = the identifier resolves but the title does not (the fabrication pattern — flag it clearly); `ambiguous` = the identifier resolves to one paper but the claimed title matches a *different* real paper (a wrong-identifier citation error, not a fabrication); `not_found` = neither identifier nor title resolves anywhere. Surface the verdict plus the specific mismatched fields, not a bare yes/no.
- **Don't default the style silently.** Vancouver is the parameter default, but if the user did not name a style and any ambiguity exists, ask which style they want before formatting. Vancouver-by-default is correct for biomedical contexts; in humanities or law it would produce the wrong shape.
- **Disambiguate Harvard and Chicago variants.** Both have multiple variants (`harvard-cite-them-right` vs other Harvard flavours; `chicago-author-date` vs `chicago-note-bibliography`). Ask the user which one they want when they say "Harvard" or "Chicago" without specifying.
- **WHO IRIS is a real differentiator.** Most other citation tools cannot resolve WHO IRIS URLs. When the user shares a WHO publication, this skill is specifically the right tool.
- **Batch single-tool calls, not loops.** Sending five identifiers as one comma-separated batch returns five citations in one response; sending them as five separate tool calls multiplies round-trips and can hit rate limits.
- **Pin the version when reproducibility matters.** The MCP server calls the current production endpoint, which produces deterministic output for the same input + cache state. The `x-scholar-cache` header in the metadata block makes cache-hit vs cache-miss visible.

## When NOT to Use This Skill

- **Searching for papers by topic or keyword, or traversing citation networks** — use a Semantic Scholar or OpenAlex MCP wrapper for *literature discovery*. Scholar Sidekick assumes you already have an identifier.
- **Reading or editing a Zotero library** — use `zotero-mcp` for stateful library access (search, annotate, manage collections).
- **Repairing references inside a manuscript file** (`.tex`, `.bib`, `.md`, `.docx`) — use `citecheck` for that workflow.
- **No MCP host available** — use the `scholar-sidekick-api` skill, which calls the same REST service over `curl` with no install and no key.

These tools compose well — Scholar Sidekick handles the formatting layer once another tool has produced the identifier.
