import { API, API_ROOT } from '../support/commands';

describe('Clients', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.fixture('client').as('client');
    cy.intercept('POST', `${API_ROOT}/v2/clients/search`, (req) => {
      const text: string = req.body.request.text || '';
      const content = text && !'jane doe'.includes(text.toLowerCase()) ? [] : [{ ...clientListRow }];
      req.reply({ content, totalElements: content.length, numberOfElements: content.length, totalPages: 1 });
    }).as('searchClients');
    cy.intercept('GET', `${API}/clients/template*`, { fixture: 'client-template' });
    cy.intercept('GET', `${API}/clients/1?*`, { fixture: 'client' });
    cy.intercept('GET', `${API}/clients/1`, { fixture: 'client' }).as('getClient');
    cy.intercept('GET', `${API}/clients/1/accounts`, { fixture: 'client-accounts' });
    cy.intercept('GET', `${API}/clients/1/charges*`, { totalFilteredRecords: 0, pageItems: [] });
    cy.intercept('GET', `${API}/clients/1/images*`, { statusCode: 404, body: {} });
    cy.intercept('GET', `${API}/runreports/ClientSummary*`, [
      { activeLoans: 1, activeSavings: 1, activeLoanBalance: 8000, activeSavingsBalance: 1500 }]);
    cy.intercept('GET', `${API}/datatables?apptable=m_client`, []);
    cy.intercept('GET', `${API}/fieldconfiguration/ADDRESS`, []);
  });

  const clientListRow = {
    id: 1,
    accountNumber: '000000001',
    externalId: 'EXT-001',
    displayName: 'Jane Doe',
    status: { code: 'clientStatusType.active', value: 'Active' },
    officeName: 'Head Office',
    activationDate: [
      2024,
      1,
      15
    ]
  };

  it('searches and lists clients', () => {
    cy.visitAuthenticated('/#/clients');
    cy.wait('@searchClients');
    cy.contains('button', 'Create Client').should('be.visible');
    cy.get('input.search-box').type('Jane{enter}');
    cy.wait('@searchClients').its('request.body.request.text').should('eq', 'Jane');
    cy.get('table[mat-table] tbody tr').should('have.length', 1);
    cy.get('table[mat-table] tbody tr').first().should('contain', 'Jane Doe').and('contain', 'Head Office');
    cy.get('table[mat-table] tbody tr td').first().click();
    cy.url().should('include', '/clients/1/general');
  });

  it('creates a client through the stepper', () => {
    cy.intercept('POST', `${API}/clients`, { officeId: 1, clientId: 1, resourceId: 1 }).as('createClient');

    cy.visitAuthenticated('/#/clients/create');
    cy.get('mat-horizontal-stepper').should('be.visible');
    cy.selectOption('officeId', 'Head Office');
    cy.get('mat-select[formcontrolname="legalFormId"]').should('contain', 'PERSON');
    cy.get('input[formcontrolname="firstname"]').type('Jane');
    cy.get('input[formcontrolname="lastname"]').type('Doe');
    cy.get('input[formcontrolname="externalId"]').type('EXT-001');
    cy.get('input[formcontrolname="mobileNo"]').type('5551234567');
    cy.checkBox('active');
    cy.pickToday('activationDate');
    cy.selectOption('genderId', 'Female');

    cy.contains('.mat-step-label', 'PREVIEW').click();
    cy.contains('Jane').should('be.visible');
    cy.contains('Doe').should('be.visible');
    cy.contains('button', 'Submit').click();

    cy.wait('@createClient')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({
          officeId: 1,
          legalFormId: 1,
          firstname: 'Jane',
          lastname: 'Doe',
          externalId: 'EXT-001',
          active: true,
          genderId: 22
        });
        expect(body).to.have.property('locale', 'en');
        expect(body).to.have.property('dateFormat');
        expect(body).to.have.property('activationDate');
      });
    cy.url().should('include', '/clients/1');
  });

  it('views a client with the general tab and accounts overview', () => {
    cy.visitAuthenticated('/#/clients/1/general');
    cy.wait('@getClient');
    cy.get('mifosx-clients-view').within(() => {
      cy.contains('Jane Doe');
      cy.contains('Head Office');
      cy.contains('000000001');
      cy.contains('Officer, Alice');
    });
    cy.contains('h3', 'Loan Accounts');
    cy.contains('Personal Loan');
    cy.contains('h3', 'Saving Accounts');
    cy.contains('Passbook Savings');
    cy.get('button[aria-label="Client actions"]').click();
    cy.get('.cdk-overlay-pane .mat-menu-panel').should('contain', 'Edit');
  });
});
