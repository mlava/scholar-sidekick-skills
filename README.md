# Scholar Sidekick - Agent Skills

Portable [Agent Skills](https://agentskills.io) that teach AI agents to use
**[Scholar Sidekick](https://scholar-sidekick.com)** - a fast, deterministic citation
resolver, formatter, exporter, and **citation verifier**.

Paste any scholarly identifier (DOI, PMID, PMCID, ISBN, ISSN, arXiv ID, ADS bibcode, or a
WHO IRIS URL) and get a clean citation in 10,000+ CSL styles, a bibliography file
(BibTeX, RIS, EndNote, CSL-JSON, CSV...), a **retraction** check (Crossref + Retraction
Watch), an **open-access** check (Unpaywall), or a **fabrication** check that catches the
real-DOI-plus-invented-title pattern (Topaz et al., Lancet 2026) that plain DOI resolution
misses.

## Skills in this repo

| Skill | Path | Use when |
|-------|------|----------|
| **`scholar-sidekick-api`** | [`skills/scholar-sidekick-api`](skills/scholar-sidekick-api/SKILL.md) | **Zero-install.** The agent can run `curl`/HTTP. No API key, no setup — calls the public REST API directly. Start here. |
| **`scholar-sidekick-mcp`** | [`skills/scholar-sidekick-mcp`](skills/scholar-sidekick-mcp/SKILL.md) | The host has the [`scholar-sidekick-mcp`](https://github.com/mlava/scholar-sidekick-mcp) MCP server connected (works anonymously — no key required; optional `SCHOLAR_API_KEY`/`RAPIDAPI_KEY` raise limits). Native tool calls instead of `curl`. |

Both expose the same capabilities; pick the one that matches how your agent is wired.

## Install

These skills follow the open `SKILL.md` convention, so they install in any compatible agent
(Claude Code, Codex, Cursor, Windsurf, OpenClaw, and more):

```bash
# list what's in the repo
npx -y skills@latest add mlava/scholar-sidekick-skills --list

# add everything in the repo (both skills)
npx -y skills@latest add mlava/scholar-sidekick-skills
```

Or install one skill by its explicit `skills/<name>` path:

```bash
# zero-install REST skill (start here)
npx -y skills@latest add mlava/scholar-sidekick-skills/skills/scholar-sidekick-api

# MCP skill (host has the scholar-sidekick-mcp server connected)
npx -y skills@latest add mlava/scholar-sidekick-skills/skills/scholar-sidekick-mcp
```

> Browse the rendered docs: [scholar-sidekick-api](https://www.skills.sh/mlava/scholar-sidekick-skills/scholar-sidekick-api)
> · [scholar-sidekick-mcp](https://www.skills.sh/mlava/scholar-sidekick-skills/scholar-sidekick-mcp) on skills.sh.

## Quick taste (no install)

```bash
curl -sS -X POST "https://scholar-sidekick.com/api/format" \
  -H "Content-Type: application/json" \
  -d '{"text":"10.1038/nphys1170","style":"apa","output":"text"}'
```

## Discovery surfaces (built for agents)

- **API contract:** https://scholar-sidekick.com/llms.txt · https://scholar-sidekick.com/AGENTS.md
- **OpenAPI 3.1:** https://scholar-sidekick.com/openapi/openapi.yml
- **Agent Skills discovery index:** https://scholar-sidekick.com/.well-known/agent-skills/index.json
- **MCP server:** https://github.com/mlava/scholar-sidekick-mcp · `npx -y scholar-sidekick-mcp@latest`
- **Data sources & determinism:** https://scholar-sidekick.com/.well-known/sources.json
- **Browse on skills.sh:** https://www.skills.sh/mlava/scholar-sidekick-skills

## Not a paper-search tool

These skills assume you already have an identifier. To *find* papers by topic, pair with a
literature-discovery tool (e.g. an `arxiv`, Semantic Scholar, or OpenAlex skill). Scholar
Sidekick handles the cite / export / verify layer once you have the ID.

## License

[MIT](LICENSE) © Scholar Sidekick.
