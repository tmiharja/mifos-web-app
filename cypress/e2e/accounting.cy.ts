import { API } from '../support/commands';

describe('Accounting', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.intercept('GET', `${API}/offices*`, { fixture: 'offices' });
    cy.intercept('GET', `${API}/currencies`, { fixture: 'currencies' });
    cy.intercept('GET', `${API}/paymenttypes`, { fixture: 'payment-types' });
    cy.intercept('GET', `${API}/glaccounts*`, { fixture: 'gl-accounts' });
    cy.intercept('GET', `${API}/journalentries?*`, { fixture: 'journal-entries' }).as('journalEntries');
  });

  it('shows the accounting landing page and navigates to journal entries', () => {
    cy.visitAuthenticated('/#/accounting');
    cy.contains('Frequent Postings');
    cy.contains('Create Journal Entries');
    cy.contains('Chart of Accounts');
    cy.contains('h4', 'Search Journal Entries').click();
    cy.url().should('include', '/accounting/journal-entries');
    cy.wait('@journalEntries');
    cy.get('table[mat-table] tbody tr').should('have.length', 2);
    cy.get('table[mat-table] tbody tr').first().should('contain', 'L1A2B3C4D5').and('contain', 'Head Office');
  });

  it('creates a balanced manual journal entry and views the transaction', () => {
    cy.intercept('POST', `${API}/journalentries`, { officeId: 1, transactionId: 'L1A2B3C4D5' }).as('createEntry');

    cy.visitAuthenticated('/#/accounting/journal-entries/create');
    cy.selectOption('officeId', 'Head Office');
    cy.selectOption('currencyCode', 'US Dollar');

    cy.get('mifosx-gl-account-selector').eq(0).find('mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('(10100) Cash').click();
    cy.get('input[formcontrolname="amount"]').eq(0).type('1000');
    cy.get('mifosx-gl-account-selector').eq(1).find('mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('(40100) Interest Income').click();
    cy.get('input[formcontrolname="amount"]').eq(1).type('1000');

    cy.get('input[formcontrolname="referenceNumber"]').type('REF-001');
    cy.pickToday('transactionDate');
    cy.selectOption('paymentTypeId', 'Cash');
    cy.get('textarea[formcontrolname="comments"]').type('Cypress journal entry');
    cy.contains('form button', 'Submit').click();

    cy.wait('@createEntry')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({
          officeId: 1,
          currencyCode: 'USD',
          referenceNumber: 'REF-001',
          paymentTypeId: 1,
          locale: 'en'
        });
        expect(body.debits).to.deep.equal([{ glAccountId: 1, amount: 1000 }]);
        expect(body.credits).to.deep.equal([{ glAccountId: 3, amount: 1000 }]);
        expect(body).to.have.property('transactionDate');
      });

    cy.url().should('include', '/accounting/journal-entries/transactions/view/L1A2B3C4D5');
    cy.wait('@journalEntries').its('request.query').should('include', { transactionId: 'L1A2B3C4D5' });
    cy.get('table[mat-table] tbody tr').should('have.length', 2);
    cy.get('table[mat-table] tbody tr')
      .eq(0)
      .should('contain', 'ASSET')
      .and('contain', 'Cash')
      .and('contain', '1,000.00');
    cy.get('table[mat-table] tbody tr').eq(1).should('contain', 'INCOME').and('contain', 'Interest Income');
    cy.contains('button', 'Revert Transaction').should('be.visible');
  });
});
