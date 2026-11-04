# Enigma Gestão Unified Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish `Enigma Gestão (Produção)` as the only canonical Git workspace while preserving the Antigravity product experience and all source folders as recoverable references.

**Architecture:** Start from a read-only snapshot of the Antigravity UI project, excluding caches, local secrets, generated output, and competing active database schema. Add shared project context and rules at the root so Codex and Antigravity read the same instructions. Preserve Codex Supabase work as a separate reviewed source until its contracts are mapped to the Antigravity domain; do not merge migrations or UI in this workspace bootstrap.

**Tech Stack:** React 19, TypeScript, Vite 8, Express/tsx development server, npm lockfile, Git, Supabase assets staged for later review.

**Spec:** `docs/superpowers/specs/2026-11-04-enigma-producao-unificada-design.md`

## Global Constraints

- Antigravity remains the visual and interaction source of truth.
- The product has one experience; Supabase is the persistence/auth foundation, not a user-facing mode.
- Keep demo data synthetic; never copy local environment files, credentials, private keys, or live personal data.
- Preserve both original project folders and the Codex Supabase worktree unchanged during consolidation.
- Do not combine incompatible database schemas or migrations.
- Do not publish to production or connect a remote database during workspace bootstrap.
- Reconcile the active Antigravity queue before treating the snapshot as final or opening the new root as a second writer.

## Review Focus

- A source file changes during snapshot: record snapshot time and reconcile later queue edits before declaring parity.
- Local secrets are present under ignored or nested paths: exclude all `.env*`, credentials, and private-key files recursively.
- Database migration directories conflict: exclude reference migrations from the active workspace until a schema decision is reviewed.
- Git history is absent in Antigravity: make a clearly labeled baseline commit without altering either source folder.
- Antigravity and Codex interpret root rules differently: keep `AGENTS.md` concise and link to shared, versioned context and domain docs.

---

### Task 1: Prepare the canonical workspace snapshot

**Files:**
- Create: project source snapshot under the workspace root (from the Antigravity directory)
- Modify: `.gitignore`
- Create: `SNAPSHOT-ORIGIN.md`

**Interfaces:**
- Source: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Estudo)\Google IA Studio\enigma-gestão-GoogleIAStudio-v1`
- Destination: `C:\Users\Baroli\OneDrive\Documents\Vibe Kode\Enigma Gestão (Produção)`
- Snapshot exclusions: `.git`, `node_modules`, `dist`, `build`, coverage/cache directories, `.env*`, secrets/credentials/private keys, generated logs, and the Antigravity `supabase`/Drizzle schema until reviewed.
- Preserve source package manifests and lockfiles; do not resolve duplicate dependency or package-manager choices in this task.

- [ ] Inspect source and destination paths; confirm destination contains only approved design/planning docs before copying.
- [ ] Copy source files without deleting or modifying source files; capture timestamp, file counts, and exclusions in `SNAPSHOT-ORIGIN.md`.
- [ ] Record files/directories deliberately omitted, especially active schema and local secrets.
- [ ] Confirm the copy contains the Antigravity app shell, screens, styles, context, public assets, and package manifests.

### Task 2: Add shared second-brain instructions

**Files:**
- Create: `AGENTS.md`
- Create: `PROJECT_CONTEXT.md`
- Create: `docs/STATE.md`
- Create: `docs/architecture/overview.md`
- Create: `docs/decisions/0001-antigravity-ui-codex-data-foundation.md`
- Create: `.agents/rules/*`
- Create: `.agents/skills/tirar-cara-de-ia/*` (reviewed skill and license)

**Interfaces:**
- `AGENTS.md` is the short entry point shared by coding agents.
- `PROJECT_CONTEXT.md` identifies product goals, synthetic-data boundary, and canonical workspace.
- `docs/STATE.md` tracks current milestones, known gaps, active queue reconciliation, and next action.
- `docs/architecture/overview.md` maps UI, domain/context, local demo persistence, and the planned data boundary.
- Keep existing Enigma UX/UI skills; add only the reviewed MIT audit skill and preserve its LICENSE/attribution.

- [ ] Write concise root agent instructions and link to the project/domain/security docs.
- [ ] Document one product experience, UI source of truth, single-writer rule, and command-channel guidance.
- [ ] Record known model/schema differences without treating estimates or synthetic values as real data.
- [ ] Copy and scope the reviewed visual audit skill under project-local `.agents/skills/` with its license.
- [ ] Verify referenced docs and skill paths exist and do not include secrets.

### Task 3: Establish the Git baseline and handoff

**Files:**
- Create: Git metadata in the canonical workspace
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Initial branch: `main`
- Initial commit: `chore: establish unified production workspace baseline`
- README must explain local demo startup and that data remains synthetic; do not claim production readiness.

- [ ] Initialize Git only in `Enigma Gestão (Produção)` and verify both source repositories/worktrees remain unchanged.
- [ ] Review staged paths for `.env*`, credential files, private keys, generated files, and unreviewed database schema.
- [ ] Update README with app entry point, development command, canonical workspace, and current deployment gate.
- [ ] Create the baseline commit after the snapshot and shared docs are reviewable.
- [ ] Record the next two work items: reconcile Antigravity's queued changes, then map Supabase contracts and security to the preserved UI/domain.

### Task 4: Reconcile the Antigravity queue and open the shared root

**Files:**
- Modify: snapshot files that correspond to completed queued prompts
- Modify: `docs/STATE.md`
- Modify: `SNAPSHOT-ORIGIN.md`

**Interfaces:**
- Each completed queued change is compared individually against the snapshot; no bulk overwrite of the unified workspace.
- Only one writer may edit a given file set at a time.

- [ ] Wait for the existing serial Antigravity queue to finish without editing, clearing, or interrupting it.
- [ ] Compare the old source and canonical workspace, review each changed file, and port only intended changes.
- [ ] Record rejected, superseded, or conflicting changes with a reason in the handoff log.
- [ ] Open the canonical workspace in Antigravity and confirm both tools see the same root `AGENTS.md` and project context.
- [ ] Keep the source project as a read-only recovery copy after successful reconciliation.

### Task 5: Prepare phased integration handoffs

**Files:**
- Create: `docs/superpowers/plans/2026-11-04-ui-quality-and-demo.md`
- Create: `docs/superpowers/plans/2026-11-04-supabase-integration-and-release.md`
- Modify: `docs/STATE.md`

**Interfaces:**
- UI plan preserves all Antigravity screen structure and focuses on verified usability issues, accurate synthetic-data labeling, responsive behavior, and consistent crypto terminology.
- Supabase plan treats connected persistence as internal infrastructure and maps Antigravity domain states explicitly to reviewed Codex contracts and migrations.
- Release plan separates local demo, staging, and production and lists owner-only account/credential actions.

- [ ] Write separate, independently reviewable plans for UI quality and Supabase/release readiness.
- [ ] Include security review for auth, RLS, vault rotation/recovery, destination-change authorization, backups, and synthetic-data boundaries.
- [ ] Identify prerequisites and owner-provided decisions; do not invent secrets or deploy remotely.
- [ ] Update project state with the recommended next bounded task.

## Verification record

- This plan's execution must report snapshot file counts/exclusions, Git status, and commit hash.
- Do not run tests unless the user explicitly asks; source validation and a build may be proposed separately when the baseline is ready.
- A staging preview may be prepared after the separate release plan and only with synthetic data.
