# Scholar Sidekick - Agent Skills

Portable Agent Skills (agentskills.io) that teach AI agents to use **Scholar Sidekick**
(scholar-sidekick.com) - a fast, deterministic citation resolver, formatter, exporter, and
**citation verifier**.

Paste any scholarly identifier (DOI, PMID, PMCID, ISBN, ISSN, arXiv ID, ADS bibcode, or a
WHO IRIS URL) and get a clean citation in 10,000+ CSL styles, a bibliography file
(BibTeX, RIS, EndNote, CSL-JSON, CSV...), a **retraction** check (Crossref + Retraction
Watch), an **open-access** check (Unpaywall), or a **fabrication** check that catches the
real-DOI-plus-invented-title pattern (Topaz et al., Lancet 2026) that plain DOI resolution
misses.

## Skills in this repo

**scholar-sidekick-api** (skills/scholar-sidekick-api) — **Zero-install.** The agent can run
curl/HTTP. No API key, no setup — calls the public REST API directly. Start here.

**scholar-sidekick-cli** (skills/scholar-sidekick-cli) — The agent has **Node 20+** and
prefers typed subcommands (scholar format ...), batch input, streaming, and file redirection
over hand-built curl payloads. Ships on npm as scholar-sidekick-cli.

**scholar-sidekick-mcp** (skills/scholar-sidekick-mcp) — The host has the scholar-sidekick-mcp
MCP server connected (works anonymously — no key required; optional SCHOLAR_API_KEY or
RAPIDAPI_KEY raise limits). Native tool calls instead of curl.

All three expose the same capabilities; pick the one that matches how your agent is wired.

## Install

These skills follow the open SKILL.md convention, so they install in any compatible agent
(Claude Code, Codex, Cursor, Windsurf, OpenClaw, and more):

- List what's in the repo: `npx -y skills@latest add mlava/scholar-sidekick-skills --list`
- Add everything (all three skills): `npx -y skills@latest add mlava/scholar-sidekick-skills`

Or install one skill by its explicit skills path:

- Zero-install REST skill (start here): `npx -y skills@latest add mlava/scholar-sidekick-skills/skills/scholar-sidekick-api`
- CLI skill (agent has Node 20+; uses the scholar command): `npx -y skills@latest add mlava/scholar-sidekick-skills/skills/scholar-sidekick-cli`
- MCP skill (host has the scholar-sidekick-mcp server connected): `npx -y skills@latest add mlava/scholar-sidekick-skills/skills/scholar-sidekick-mcp`

Browse the rendered docs on skills.sh: www.skills.sh/mlava/scholar-sidekick-skills

## Quick taste (no install)

POST a DOI to the format endpoint. Send a POST to
https://scholar-sidekick.com/api/format with a Content-Type of application/json and a JSON
body containing text = 10.1038/nphys1170, style = apa, and output = text. You get back the
formatted citation.

## Discovery surfaces (built for agents)

- **API contract:** scholar-sidekick.com/llms.txt and scholar-sidekick.com/AGENTS.md
- **OpenAPI 3.1:** scholar-sidekick.com/openapi/openapi.yml
- **Agent Skills discovery index:** scholar-sidekick.com/.well-known/agent-skills/index.json
- **MCP server:** github.com/mlava/scholar-sidekick-mcp (npx -y scholar-sidekick-mcp@latest)
- **Data sources & determinism:** scholar-sidekick.com/.well-known/sources.json
- **Browse on skills.sh:** www.skills.sh/mlava/scholar-sidekick-skills

## Not a paper-search tool

These skills assume you already have an identifier. To *find* papers by topic, pair with a
literature-discovery tool (e.g. an arxiv, Semantic Scholar, or OpenAlex skill). Scholar
Sidekick handles the cite / export / verify layer once you have the ID.

## License

MIT © Scholar Sidekick.
