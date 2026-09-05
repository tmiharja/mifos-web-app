import { API } from '../support/commands';

describe('Reports', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.intercept('GET', `${API}/reports`, { fixture: 'reports' }).as('reports');
    cy.intercept('GET', `${API}/configurations`, { fixture: 'global-configurations' });
    cy.intercept('GET', `${API}/runreports/FullParameterList?*`, { fixture: 'report-parameters' }).as(
      'reportParameters'
    );
    cy.intercept('GET', `${API}/runreports/OfficeIdSelectOne?*`, { fixture: 'report-select-options' }).as(
      'officeOptions'
    );
    cy.intercept('GET', `${API}/runreports/Client%20Listing?*`, { fixture: 'report-run-data' }).as('runReport');
  });

  it('lists reports and filters by category and text', () => {
    cy.visitAuthenticated('/#/reports');
    cy.wait('@reports');
    cy.get('table[mat-table] tbody tr').should('have.length', 3);

    cy.visitAuthenticated('/#/reports/Client');
    cy.get('table[mat-table] tbody tr')
      .should('have.length', 2)
      .and('contain', 'Client Listing')
      .and('contain', 'Client Trends');

    cy.get('input[matinput]').first().type('Trends');
    cy.get('table[mat-table] tbody tr').should('have.length', 1).and('contain', 'Client Trends');
  });

  it('runs a table report and renders the results', () => {
    cy.visitAuthenticated('/#/reports');
    cy.wait('@reports');
    cy.contains('table[mat-table] tbody tr', 'Client Listing').click();
    cy.url().should('include', '/reports/run/Client%20Listing').and('include', 'type=Table');
    cy.wait('@reportParameters').its('request.query.R_reportListing').should('eq', "'Client Listing'");
    cy.wait('@officeOptions');

    cy.contains('button', 'Run Report').should('be.disabled');
    cy.contains('mat-form-field', 'Office').find('mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('Head Office').click();
    cy.contains('button', 'Run Report').click();

    cy.wait('@runReport').its('request.query').should('include', { R_officeId: '1' });
    cy.get('mifosx-table-and-sms table[mat-table]').should('be.visible');
    cy.get('mifosx-table-and-sms table[mat-table] thead')
      .should('contain', 'Client Name')
      .and('contain', 'Loan Officer');
    cy.get('mifosx-table-and-sms table[mat-table] tbody tr')
      .should('have.length', 2)
      .first()
      .should('contain', 'Jane Doe');
  });
});
