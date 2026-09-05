import { API } from '../support/commands';

describe('Admin / System configuration', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.intercept('GET', `${API}/configurations`, { fixture: 'global-configurations' }).as('configurations');
    cy.intercept('GET', `${API}/configurations/7`, { fixture: 'global-configuration' }).as('configuration');
  });

  it('navigates from the system page to global configurations and filters them', () => {
    cy.visitAuthenticated('/#/system');
    cy.contains('h4', 'Configurations').click();
    cy.url().should('include', '/system/configurations');
    cy.wait('@configurations');
    cy.contains('.mat-tab-label', 'Global Configurations').should('be.visible');
    cy.get('table[mat-table] tbody tr').should('have.length', 6);

    cy.get('input[matinput]').first().type('holiday');
    cy.get('table[mat-table] tbody tr').should('have.length', 1).and('contain', 'allow-transactions-on-holiday');
  });

  it('toggles a configuration on and off', () => {
    cy.intercept('PUT', `${API}/configurations/7`, {
      resourceId: 7,
      changes: { enabled: true }
    }).as('toggle');

    cy.visitAuthenticated('/#/system/configurations');
    cy.wait('@configurations');
    cy.contains('table[mat-table] tbody tr', 'allow-transactions-on-holiday').as('row');
    cy.get('@row').should('contain', 'Disabled');
    cy.get('@row').find('mat-slide-toggle').click();

    cy.wait('@toggle').its('request.body').should('deep.equal', { enabled: true });
    cy.get('@row').should('contain', 'Enabled');
  });

  it('edits a configuration value', () => {
    cy.intercept('PUT', `${API}/configurations/7`, {
      resourceId: 7,
      changes: { value: 5 }
    }).as('update');

    cy.visitAuthenticated('/#/system/configurations/7/edit');
    cy.wait('@configuration');
    cy.get('input[formcontrolname="name"]').should('have.value', 'allow-transactions-on-holiday').and('be.disabled');
    cy.get('input[formcontrolname="value"]').clear().type('5');
    cy.contains('button', 'Submit').click();

    cy.wait('@update').its('request.body').should('include', { value: 5 });
    cy.url().should('match', /\/system\/configurations$/);
    cy.wait('@configurations');
    cy.get('table[mat-table] tbody tr').should('have.length', 6);
  });
});
