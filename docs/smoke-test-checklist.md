# Manual smoke-test checklist

This is the human gate for every Angular major-version hop on the
`feature/angular-21` branch. Run it against a production build
(`npm run build:prod`, served from `dist/`) pointed at a Fineract backend seeded
with the default demo data (`mifos` / `password`, tenant `default`).

Record the result of each hop in the PR description:

| Hop | Date | Tester | Result | Notes |
| --- | ---- | ------ | ------ | ----- |

Mark every row below as pass/fail. Any failure blocks the hop until fixed.

## Automated counterpart

Sections 1-8 are mirrored by the Cypress suite under `cypress/e2e/` (`login`,
`clients`, `loans`, `savings`, `accounting`, `reports`, `system`, `i18n`). It
runs against a static production build with the Fineract API stubbed via
`cy.intercept`, so it needs no backend and runs in CI (`Tests / Cypress e2e`
in `.github/workflows/test.yml`). Locally:

```bash
npm run build
python3 -m http.server 4200 --directory dist/web-app &
npm run cypress:run        # or: npm run cypress:open
```

The automated suite catches layout/Material regressions early; this manual
checklist remains the gate against a real backend.

## 0. Boot

- [ ] `npm start` compiles with no errors and no new console warnings.
- [ ] `npm run build:prod` succeeds; `dist/web-app/index.html` loads without a
      blank screen or console errors.
- [ ] App shell renders: toolbar, sidenav, breadcrumbs, footer with version.

## 1. Login / authentication

- [ ] `/#/login` shows username, password, "Remember me" and the language selector.
- [ ] Wrong credentials show an "Authentication Error" alert.
- [ ] Correct credentials (`mifos` / `password`) redirect to `/#/home` (Home dashboard).
- [ ] Password-expired / business-date warning dialogs (if shown) can be dismissed.
- [ ] Refreshing the page keeps the session (token restored from storage).
- [ ] User menu > Logout returns to the login page and clears the session.

## 2. Clients

- [ ] `Clients` list loads with pagination and search.
- [ ] `Clients > Create client` (`/#/clients/create`) completes the stepper
      (General, Family Members, Address, Datatables, Preview) and submits.
- [ ] New client opens in `/#/clients/:clientId` with General tab, and status
      `Pending` (or `Active` when activated on creation).
- [ ] `Client Actions > Activate` activates the client; status chip updates.
- [ ] Tabs render: General, Address, Family Members, Identities, Documents, Notes.

## 3. Loan accounts

- [ ] From a client: `New Loan Account` (`/#/clients/:clientId/loans-accounts/create`)
      opens the loan stepper; product select populates Terms and Charges steps.
- [ ] Repayment schedule preview renders (table with periods).
- [ ] Submit creates the loan in `Submitted and pending approval`.
- [ ] `Loan Actions > Approve` succeeds; status `Approved`.
- [ ] `Loan Actions > Disburse` succeeds; status `Active`.
- [ ] `Repayment Schedule` and `Transactions` tabs show the disbursement.
- [ ] `Loan Actions > Make Repayment` posts a repayment and updates the balance.

## 4. Savings accounts

- [ ] From a client: `New Savings Account` (`.../savings-accounts/create`)
      completes the stepper and submits.
- [ ] `Approve` then `Activate` the account.
- [ ] `Deposit` and `Withdraw` post transactions; balance and Transactions tab update.

## 5. Accounting

- [ ] `Accounting` landing page (`/#/accounting`) shows the tile menu.
- [ ] `Chart of Accounts` (`/#/accounting/chart-of-accounts`) lists GL accounts
      in both list and tree view.
- [ ] `Create Journal Entries` (`/#/accounting/journal-entries/create`): pick an
      office, add at least one debit and one credit, submit; the resulting
      transaction opens at `/#/accounting/journal-entries/transactions/view/:id`.
- [ ] `Search Journal Entries` filters by office / date and paginates.
- [ ] `Reverse` a journal entry from its view page works.

## 6. Reports

- [ ] `Reports` (`/#/reports`) lists reports and filters by type
      (All / Clients / Loans / Savings / Funds / Accounting / XBRL).
- [ ] Run a table report (e.g. `Client Listing`) with parameters; a Material
      table renders and CSV export works.
- [ ] Run a chart report (e.g. `Demand Vs Collection`) if available; the
      Chart.js canvas renders (pie/bar) without console errors.
- [ ] Run a Pentaho report and confirm the PDF/XLS download is triggered.

## 7. Admin / system configuration

- [ ] `Admin > System` (`/#/system`) tile page renders.
- [ ] `Global Configurations` (`/#/system/configurations`) lists items; toggling
      an enable flag and editing a value persists after reload.
- [ ] `Manage Codes` create/edit/delete a code value.
- [ ] `Manage Data Tables` list and view one table.
- [ ] `Manage Roles and Permissions` view a role; permission checkboxes render.
- [ ] `Manage Scheduler Jobs` lists jobs; `Run selected jobs` executes one.
- [ ] `Admin > Organization > Manage Offices` create and view an office.
- [ ] `Admin > Users` create a user and log in with it.
- [ ] `Admin > Products > Loan Products` open an existing product; all stepper
      tabs render (Details, Currency, Terms, Settings, Charges, Accounting, Preview).

## 8. Internationalisation

- [ ] Toolbar language menu switches to Spanish (`es-MX`) and the navigation
      labels, login page and dialogs update immediately.
- [ ] Switch back to English (`en-US`); `Settings` page shows the same language
      and the date format / language settings persist across reload
      (`mifosXLanguage` in localStorage).
- [ ] Locale-sensitive views (date pickers, currency amounts) format according
      to the selected language.

## 9. Cross-cutting UI (Material / layout regressions)

- [ ] Dialogs open centred and close on Cancel / Escape (delete, confirmation,
      form dialogs).
- [ ] Snack-bar / alert toasts appear for success and error responses.
- [ ] Tables sort, paginate and keep column widths; sticky headers still work.
- [ ] Date pickers (Material) and datetime pickers open and select values.
- [ ] Sidenav collapses on `< md` widths; toolbar search works.
- [ ] Application menu (avatar icon) opens; Settings and Logout entries work.
- [ ] No `ExpressionChangedAfterItHasBeenChecked`, `NG0xxx`, or Material
      deprecation errors in the browser console during the run.
