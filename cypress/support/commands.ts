/**
 * Shared Cypress commands.
 *
 * The e2e suite runs against a static build of the web app with the Fineract
 * REST API stubbed via `cy.intercept`, so it needs no backend and is
 * deterministic in CI. `cy.stubApi()` installs the catch-all plus the calls
 * the shell fires on every page; specs add their own, more specific,
 * intercepts on top (Cypress matches the most recently defined one first).
 */

export const API_ROOT = '**/fineract-provider/api';
export const API = `${API_ROOT}/v1`;

const credentials = {
  username: 'mifos',
  userId: 1,
  base64EncodedAuthenticationKey: 'bWlmb3M6cGFzc3dvcmQ=',
  authenticated: true,
  officeId: 1,
  officeName: 'Head Office',
  roles: [{ id: 1, name: 'Super user', description: 'This role provides all application permissions.' }],
  permissions: ['ALL_FUNCTIONS'],
  shouldRenewPassword: false,
  isTwoFactorAuthenticationRequired: false
};

declare global {
  namespace Cypress {
    interface Chainable {
      /** Stubs the API calls made by the application shell on every page. */
      stubApi(): Chainable<void>;
      /** Visits `path` with an authenticated session already in sessionStorage. */
      visitAuthenticated(path: string): Chainable<void>;
      /** Fills in and submits the login form. */
      loginViaUi(username?: string, password?: string): Chainable<void>;
      /** Selects `optionText` in the mat-select bound to `formControlName`. */
      selectOption(formControlName: string, optionText: string): Chainable<void>;
      pickToday(formControlName: string): Chainable<void>;
      checkBox(formControlName: string): Chainable<void>;
      stepperClick(buttonText: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('stubApi', () => {
  cy.intercept(`${API_ROOT}/**`, { statusCode: 200, body: [] }).as('api');
  cy.intercept('POST', `${API}/authentication`, credentials).as('authentication');
  cy.intercept('GET', `${API}/notifications*`, { totalFilteredRecords: 0, pageItems: [] });
  cy.intercept('GET', `${API}/configurations/name/enable-business-date`, {
    id: 40,
    name: 'enable-business-date',
    value: 0,
    enabled: false,
    trapDoor: false
  });
  cy.intercept('GET', `${API}/businessdate`, []);
});

Cypress.Commands.add('visitAuthenticated', (path: string) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem('mifosXCredentials', JSON.stringify({ ...credentials, rememberMe: false }));
    }
  });
});

Cypress.Commands.add('loginViaUi', (username = 'mifos', password = 'password') => {
  cy.get('input[formcontrolname="username"]').clear().type(username);
  cy.get('input[formcontrolname="password"]').clear().type(password);
  cy.get('mifosx-login-form button.login-button').first().click();
});

Cypress.Commands.add('selectOption', (formControlName: string, optionText: string) => {
  cy.get(`mat-select[formcontrolname="${formControlName}"]`).click();
  cy.get('.cdk-overlay-pane mat-option').contains(optionText).click();
});

Cypress.Commands.add('pickToday', (formControlName: string) => {
  cy.get(`input[formcontrolname="${formControlName}"]`).click();
  cy.get('mat-calendar .mat-calendar-body-active').click();
  cy.get('mat-calendar').should('not.exist');
  cy.get(`input[formcontrolname="${formControlName}"]`).should('not.have.value', '');
});

Cypress.Commands.add('checkBox', (formControlName: string) => {
  cy.get(`mat-checkbox[formcontrolname="${formControlName}"] .mat-checkbox-inner-container`).click();
});

Cypress.Commands.add('stepperClick', (buttonText: string) => {
  cy.get('.mat-horizontal-stepper-content')
    .filter((_, el) => el.ownerDocument.defaultView.getComputedStyle(el).visibility !== 'hidden')
    .contains('button', buttonText)
    .click();
});
