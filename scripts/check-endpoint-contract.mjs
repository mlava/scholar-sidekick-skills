#!/usr/bin/env node
// scripts/check-endpoint-contract.mjs
//
// Cross-repo endpoint contract for the skills hub. The SKILL.md files teach
// agents to call Scholar Sidekick REST endpoints verbatim (curl examples + a
// method/path table). If the website (scholar-sidekick repo) renames or removes
// an endpoint, these skills silently teach a dead path. This script extracts the
// `/api/*` paths the skills reference and asserts each is still a documented path
// in the published OpenAPI spec.
//
// Sibling of scholar-sidekick-mcp / -cli / -vscode `endpoint-contract.test.ts`,
// adapted to a markdown repo with no test runner. Run on a daily cron (see
// .github/workflows/ci.yml). Network-dependent by nature.
//
// Usage:  node scripts/check-endpoint-contract.mjs

import fs from "node:fs";
import path from "node:path";

const SKILLS_DIR = path.join(process.cwd(), "skills");
const OPENAPI_URL = "https://scholar-sidekick.com/.well-known/openapi.json";

/**
 * Extract SS endpoint paths the skills pin. Scoped to avoid false positives —
 * only `scholar-sidekick.com/api/...` URLs and `POST|GET /api/...` method forms,
 * NOT bare `/api/...` substrings (e.g. the RapidAPI marketplace URL
 * rapidapi.com/.../api/scholar-sidekick, which is not an API endpoint).
 */
function pinnedEndpoints() {
  const found = new Set();
  const files = fs
    .readdirSync(SKILLS_DIR)
    .map((slug) => path.join(SKILLS_DIR, slug, "SKILL.md"))
    .filter((p) => fs.existsSync(p));

  const patterns = [
    /scholar-sidekick\.com(\/api\/[a-z0-9/-]+)/g,
    /\b(?:POST|GET)\s+(\/api\/[a-z0-9/-]+)/g,
  ];

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    for (const re of patterns) {
      for (const m of src.matchAll(re)) found.add(m[1]);
    }
  }
  return [...found].sort();
}

async function main() {
  const pinned = pinnedEndpoints();
  if (pinned.length === 0) {
    console.error("check-endpoint-contract: no /api/* paths found in skills — pattern likely broke");
    process.exit(1);
  }

  const res = await fetch(OPENAPI_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    console.error(`check-endpoint-contract: could not fetch ${OPENAPI_URL} (${res.status})`);
    process.exit(1);
  }
  const spec = await res.json();
  const documented = new Set(Object.keys(spec.paths ?? {}));

  const missing = pinned.filter((p) => !documented.has(p));
  if (missing.length > 0) {
    console.error(
      `check-endpoint-contract: ${missing.length} path(s) taught by the skills are NOT in the published OpenAPI spec — the website may have renamed or removed them:\n  ${missing.join("\n  ")}`,
    );
    process.exit(1);
  }

  console.log(`check-endpoint-contract: OK — all ${pinned.length} taught endpoints are documented:\n  ${pinned.join("\n  ")}`);
}

main().catch((err) => {
  console.error("check-endpoint-contract: unexpected error", err);
  process.exit(1);
});
