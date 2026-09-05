# Angular 14 baseline (NG21-0.2)

Captured on `main` (cf693b0fa) with Node 22.12.0 / npm 10.9, before any Angular
major-version hop. Every hop on `feature/angular-21` is compared against this.

## Toolchain

| Item             | Baseline                         | After Phase 0                         |
| ---------------- | -------------------------------- | ------------------------------------- |
| Angular          | 14.3.0 (CLI 14.2.12)             | unchanged                             |
| TypeScript       | 4.8.x                            | unchanged                             |
| RxJS             | 6.6.7                            | 7.8.x                                 |
| chart.js         | 3.0.0-alpha                      | 4.5.x                                 |
| @angular-eslint  | schematics 14.4.0 / plugins 19.x | all 19.8.1                            |
| Node (`engines`) | `>= 16`                          | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` |

## `npm run lint`

- Baseline: **failed** - `ng lint`, stylelint and prettier passed; htmlhint
  reported 10 errors in 6 files (`inline-style-disabled`,
  `attr-no-duplication`).
- After Phase 0: passes (fixed in `NG21-0.2: triage baseline lint/test failures`).

## Production build (`npm run build`)

| Chunk          | Baseline (raw / transfer) | After chart.js 4 (raw / transfer) |
| -------------- | ------------------------- | --------------------------------- |
| `main.js`      | 8.13 MB / 1.14 MB         | 8.16 MB / 1.16 MB                 |
| `styles.css`   | 635.45 kB / 49.08 kB      | unchanged                         |
| `polyfills.js` | 46.49 kB / 14.25 kB       | unchanged                         |
| `runtime.js`   | 3.22 kB / 1.48 kB         | 4.07 kB / 1.84 kB                 |
| **Initial**    | **8.80 MB / 1.21 MB**     | **8.83 MB / 1.22 MB**             |
| Largest lazy   | `loans` 1.16 MB / 177 kB  | unchanged                         |

21 `CommonJS or AMD dependencies can cause optimization bailouts` warnings,
all from third-party packages (`html2canvas`, `canvg` -> `core-js`, `raf`,
`rgbcolor`, `buffer`; `ngx-graph` -> `dagre`, `webcola`; `vkbeautify`). These
are tracked for the ecosystem-library hops, not fixed in Phase 0.

## Unit tests (`ng test --watch=false`, Chrome Headless)

Baseline: **706 specs - 92 passed, 614 failed, 0 skipped**. The suite had
never been maintained: virtually every failing spec is an auto-generated
`should create` test whose `TestBed` declares only the component, so the
template cannot resolve the `translate` pipe, Material elements, `fa-icon`,
`AuthenticationService`, `ActivatedRoute` data, etc.

### Triage

Rather than editing ~600 spec files, Phase 0 fixes the test _environment_
(`src/test.ts`) so that what every feature module imports is also available
to every spec: `SharedModule` (Material, icons, translate), `PipesModule`,
`DirectivesModule`, `RouterTestingModule`, `HttpClientTestingModule`,
`NoopAnimationsModule`, core singleton services, a fake logged-in super user
in `sessionStorage` (needed by `*mifosxHasPermission`), and an empty
`ActivatedRoute` stub. One spec (`HomeComponent`) also had to declare the
dialog it opens on init, otherwise the run hung the browser.

Result after Phase 0: **706 specs - 382 passed, 324 failed, 0 skipped**
(`npm run test:ci` still exits non-zero).

| Category of the remaining 324 failures                                                                                               | Count | Action                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `Cannot read properties of undefined` - component reads resolver `data.*` or an `@Input` that the generated spec never sets          | ~306  | Needs a per-spec `ActivatedRoute`/input fixture. Tracked as tech debt; not a hop blocker (Cypress is the regression net). |
| `dialogRef.updateSize is not a function` - dialog components need a real `MatDialogRef`                                              | 4     | Per-spec `MatDialogRef` mock.                                                                                             |
| `formGroup expects a FormGroup` / `formControlName must be used with a parent formGroup` - stepper/child form components need a host | 6     | Per-spec host component.                                                                                                  |
| Misc (`passwordPreferencesData is not iterable`, `data.find`, `data.startsWith`, ...)                                                | ~8    | Per-spec fixture.                                                                                                         |

The full list of still-failing specs is in `baseline-failing-specs.txt`; a hop
must not add to that list. No spec has been disabled (`xit`/`xdescribe`).

## `npm audit` (baseline)

143 vulnerabilities (11 low, 62 moderate, 64 high, 6 critical), almost all in
the Angular 14 build toolchain (`webpack-dev-server`, `karma`, `@angular-devkit`).
These are re-audited at every hop; most disappear with the CLI upgrades.
