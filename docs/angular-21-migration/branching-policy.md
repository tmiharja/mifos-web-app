# Branching policy for the Angular 14 -> 21 migration

## Branches

- `main` - production line. Phase 0 (version-independent prerequisites) lands
  here directly through normal PRs.
- `feature/angular-21` - long-lived integration branch, created from `main`
  once Phase 0 is merged. Every Angular major hop is one PR into this branch:
  `ng update` output plus the breaking-change fixes for that version, committed
  separately per major (`Angular 14 -> 15`, `15 -> 16`, ...). No hop is
  skipped and no hop is squashed into another.
- `phase/ng<version>` (e.g. `phase/ng15`) - short-lived work branches for a
  single hop, opened from `feature/angular-21` and merged back with a merge
  commit so the per-version history stays readable.

## Keeping `feature/angular-21` in sync with `main`

- `main` is merged **into** `feature/angular-21` (never rebased) whenever a
  hop starts and before a hop PR is merged. Merging preserves the per-version
  commits that make rollback possible; rebasing a shared branch would rewrite
  them and require a force push, which is forbidden.
- Conflicts are resolved in the merge commit on `feature/angular-21`. If a
  conflict touches an Angular API that was changed by the hop, the fix is
  redone on the newer API (do not re-introduce a deprecated call).
- Hop branches are rebased onto `feature/angular-21` only while they are
  unshared (single author, no open PR). Once a PR is open they are updated by
  merging `feature/angular-21` in.

## Landing on `main`

`feature/angular-21` is merged into `main` once the Angular 21 hop is green:
lint, unit tests, production build, `npm audit` clean, Cypress suite and the
manual smoke-test checklist (`docs/smoke-test-checklist.md`) against a real
Fineract backend. Use a merge commit, not squash, so the version path remains
in history.

## Gates for every hop PR

1. `ng update @angular/core @angular/cli --dry-run` output attached.
2. All `@angular/*` packages on the same major/minor; TypeScript within the
   version's supported range.
3. `angular.json` validates against the CLI schema (no ignored errors).
4. `npm run lint`, `npm run build`, `npm run cypress:run` green; unit tests
   must not regress against `baseline-failing-specs.txt`; no `xit`/`xdescribe`.
5. `npm audit` findings resolved or documented with an upstream reference.
6. Deprecation warnings logged in the PR description.
