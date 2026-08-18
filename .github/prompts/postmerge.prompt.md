---
description: "Post-dev-merge Definition of Done for Big Fam Festival. Run after every merge into `dev`: validate & harden, curate patch notes, update docs (ADR/README), check version-consistency drift, preview the next release-please version, then commit, push, and save memory insights. Never manually bumps manifest versions — release-please owns that."
---

# /postmerge — Big Fam Festival dev-merge closeout

**Purpose**: The repeatable Definition of Done that runs **after every merge into `dev`**. It keeps human-facing patch notes, architecture docs, and version metadata honest so nothing drifts before the eventual `dev → main` release.

**Ownership boundary (critical)**: **release-please owns all version numbers and `CHANGELOG.md`.** This routine MUST NOT edit `mobile/package.json`, `backend/package.json`, `mobile/app.json`, `.release-please-manifest.json`, or `CHANGELOG.md` version fields. It only *previews* the projected next version and *curates human docs*. Fighting release-please causes double-bumps and release-PR conflicts.

**Arguments**

| Argument | Description |
|----------|-------------|
| `(none)` | Run the full routine against the current `dev` HEAD. |
| `--since <ref>` | Diff against a specific ref/tag instead of auto-detecting the last release. |
| `--dry-run` | Do everything except commit/push; show the proposed changes. |
| `--no-push` | Commit locally but do not push. |

---

## Preconditions

1. Confirm the current branch is `dev` and the tree is clean:
   ```bash
   cd <repo-root>
   git branch --show-current   # must be dev
   git status --short          # should be clean before starting
   ```
   If not on `dev`, `git checkout dev`. Sync first:
   ```bash
   GITHUB_TOKEN= git -c credential.helper= -c credential.helper='!gh auth git-credential' pull --ff-only
   GITHUB_TOKEN= git -c credential.helper= -c credential.helper='!gh auth git-credential' fetch --prune
   ```

2. **Git auth gotcha** (this repo): the `gh` active account silently reverts to the Ford EMU account `RERIKSE3_ford`, which lacks push access. Before any push/PR, run:
   ```bash
   GITHUB_TOKEN= gh auth switch --user rlerikse
   ```
   and prefix git remote ops with `GITHUB_TOKEN= git -c credential.helper= -c credential.helper='!gh auth git-credential' ...`.

3. **Signing pre-flight**: `git config commit.gpgsign` must be `true`. If not, STOP and remediate.

---

## Step 1 — Validate & Harden

Run the quality gates for every area touched by the merge. Fix anything that fails (harden — do not leave `dev` broken).

- **Mobile** (`cd mobile`):
  ```bash
  npx tsc --noEmit
  npm run lint
  npx jest --config jest.config.js
  ```
  Note: importing `@expo/vector-icons`/`expo-image`-bearing components under Jest fails on the Expo SDK 54 font-asset transform — keep unit tests on pure helpers (see repo memory `known-issues.md`).
- **Backend** (`cd backend`, only if backend files changed): its `build`, `lint`, and `test` scripts.

If a gate fails: fix the issue, re-run, and record the fix as a memory insight (Step 6). Do not proceed to commit with a failing gate.

## Step 2 — Determine what merged since the last release cut

Identify the user-facing changes merged since the last release-notes baseline.

```bash
# Auto-detect baseline: the version in mobile/release-notes (latest N.N.N.md), or the last tag.
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
git --no-pager log --oneline --first-parent ${LAST_TAG:+$LAST_TAG..}HEAD
```

For each merged PR/feature, note: is it user-visible (What's New / Improvements & Fixes) or internal (Under the Hood)? Read the merged feature's implementation report / spec under `specs/<ID>/` when one exists — it summarizes the change and its acceptance criteria.

## Step 3 — Curate human patch notes (`mobile/release-notes/NEXT.md`)

`NEXT.md` is the human-facing draft for the next release (distinct from release-please's technical `CHANGELOG.md`). It must hold **only unreleased work**.

**Authoritative source (learned the hard way):** determine released-vs-unreleased from `CHANGELOG.md`'s **`## Unreleased`** section — NOT from assumptions or merge dates. release-please accumulates merged-but-unreleased commits there until the next release cut.
- Anything already under a versioned `## [X.Y.Z]` heading in `CHANGELOG.md` has **shipped** → it belongs in that version's `mobile/release-notes/X.Y.Z.md` file, **not** `NEXT.md`. (Do not add already-released work to `NEXT.md`.)
- Only items in `## Unreleased` belong in `NEXT.md`.

Ensure `NEXT.md` reflects **everything** currently in `CHANGELOG.md`'s `## Unreleased`:
- Add entries under the existing sections: **What's New**, **Improvements & Fixes**, **Under the Hood**, **Still under review**.
- Write in the same attendee-friendly voice as the existing entries — describe user impact, not code.
- Do **not** invent a version number or release date (the file's own disclaimer forbids it).

## Step 4 — Preview the next version (no manifest edits)

Compute the projected next semver from the commits in `CHANGELOG.md`'s `## Unreleased` section (or `git log <last-tag>..HEAD`), per release-please rules:
- any `feat:` in the unreleased set → **minor** bump; only `fix:`/`perf:`/`docs:` etc. → **patch**; `BREAKING CHANGE`/`!` → **major**.
- **Watch for this trap:** a single unreleased `feat` makes the next bump **minor** even if everything else is a `fix`. (Run 1 wrongly projected a patch because it only looked at the latest fix and missed an older unreleased `feat`.)

Reflect it as a **projection annotation** in `NEXT.md` (e.g. a `> Projected next version: X.Y.Z (release-please will finalize)` line). Never write it into the manifests or `.release-please-manifest.json`.

## Step 5 — Update architecture & reference docs

Update only what actually changed:
- **`ADR.md`** (and `docs/adr/` if the pattern applies): if the merge introduced or reversed an architectural decision, append a dated ADR entry. Cross-reference the spec's `Decisions & Rationale` (DR-*) when present.
- **`README.md`**: update if setup, commands, features, or supported behavior changed.
- **Other docs** (`docs/DEPLOYMENT_GUIDE.md`, `docs/MOBILE_RELEASE_GUIDE.md`, `docs/RELEASE_CHECKLIST.md`, etc.): update any that reference behavior the merge changed.

## Step 6 — Version-consistency drift check

Verify the version metadata is internally consistent and flag (do NOT auto-fix) any mismatch for release-please:
```bash
echo "mobile/package.json : $(node -p "require('./mobile/package.json').version")"
echo "backend/package.json: $(node -p "require('./backend/package.json').version")"
echo "mobile/app.json     : $(node -p "require('./mobile/app.json').expo.version")"
echo "release-please-manifest: $(node -p "require('./.release-please-manifest.json')['.']")"
```
All four should match the last released version. Also confirm:
- The latest `mobile/release-notes/<version>.md` matches the last released version, and `NEXT.md` covers everything merged since.
- No stale "Draft"/version references were left behind by the merged work.

Report drift as findings. If a manifest is genuinely out of sync, surface it — do not silently rewrite it (release-please reconciles versions on the release PR).

## Step 7 — Save memory insights (Protocol 6/7 — dual-write)

Record anything learned during this closeout to **both** `.specify/memory/` and VS Code repo memory:
- new patterns → `patterns.md`; decisions → `decisions.md`; bugs/workarounds/env facts → `known-issues.md`; conventions → `conventions.md`.
- Dedup against existing entries; append a one-line index reference to `MEMORY.md`.

## Step 8 — Commit & push (signed)

Write all state/memory/doc files **before** committing. Then:
```bash
# Clear GPG cache so signing prompts fresh
gpg --list-keys --with-keygrip 2>/dev/null | grep Keygrip | awk '{print $3}' \
  | while read -r g; do timeout 3 gpg-connect-agent --no-autostart "CLEAR_PASSPHRASE $g" /bye 2>/dev/null || true; done

git add mobile/release-notes/ ADR.md README.md docs/ .specify/memory/
git status --short          # review scope — feature-scoped only
git commit -S -m "docs(release): post-merge closeout — patch notes, docs, drift check"
```

**Branch protection**: `dev` requires PRs + the `CI Gate` status check. A docs-only closeout may be pushed directly **only** with owner bypass; prefer a quick docs PR for strict compliance. Default: ask the developer which they want unless `--no-push`.

Push (or open a PR):
```bash
GITHUB_TOKEN= gh auth switch --user rlerikse
GITHUB_TOKEN= git -c credential.helper= -c credential.helper='!gh auth git-credential' push origin dev
```

## Step 9 — Report

Print a concise summary:
```
✅ /postmerge complete
  Validated:   tsc / lint / jest (+ backend if touched)
  Patch notes: NEXT.md updated for {features}
  Next ver:    {projected X.Y.Z} (release-please will finalize)
  Docs:        {ADR.md / README.md / … updated | none needed}
  Drift:       {none | list}
  Memory:      {N} insights saved
  Commit:      {sha} (signed) → pushed to dev | PR #{n} | local only
```

---

## Notes

- This routine is **idempotent-ish**: re-running with no new merges should find nothing to change (clean drift check, no NEXT.md edits).
- It never touches manifest versions or `CHANGELOG.md` — that boundary is what keeps it safe alongside release-please.
- When `dev → main` finally happens, release-please consumes the conventional commits, cuts the real version, and the curated `NEXT.md` becomes the basis for the versioned release-notes file.
