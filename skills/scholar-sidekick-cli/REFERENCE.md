# scholar-sidekick-cli — Reference

Secondary detail for the `scholar` CLI. The main workflow lives in [`SKILL.md`](SKILL.md);
load this only when you need auth, global flags, or the full exit-code table.

## Authentication & limits

Works **anonymously** at the free, rate-limited tier — fine for normal agent use. To raise limits:

- **First-party key (recommended, free):** create at https://scholar-sidekick.com/account,
  prefixed `ssk_`. Pass `--api-key` or set `SCHOLAR_API_KEY`. Sent as `Authorization: Bearer ssk_…`.
- **RapidAPI key (paid/managed tiers):** `--rapidapi-key` or `RAPIDAPI_KEY` — routes through the
  RapidAPI gateway, which only exposes `format`, `export`, `verify`, `retraction`, `oa`, `health`.
  The canonical-only commands (`format-items`, `stream`, `styles`) should run anonymously or with
  a first-party key.

## Global flags / env

| Flag | Env | Default |
|---|---|---|
| `--base-url` | `SCHOLAR_SIDEKICK_URL` | `https://scholar-sidekick.com` |
| `--timeout` | `SCHOLAR_SIDEKICK_TIMEOUT_MS` | `30000` |
| `--api-key` | `SCHOLAR_API_KEY` | — |
| `--rapidapi-key` | `RAPIDAPI_KEY` | — |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | API error (4xx/5xx), or `verify --fail-on-mismatch` and verdict was `mismatch`/`not_found` |
| `2` | Network failure or timeout |
| `3` | Usage error (bad flags or invalid input) |

Check the exit code; on non-zero, report the failure — **never invent** a citation, retraction
status, OA verdict, or a `matched` verdict.
