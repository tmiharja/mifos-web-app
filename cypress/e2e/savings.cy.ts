import { API } from '../support/commands';

describe('Savings', () => {
  const accountUrl = '/#/clients/1/savings-accounts/3';
  const accountState = { fixture: 'savings-pending-approval' };
  const stubAccount = (fixture: string) => {
    accountState.fixture = fixture;
    cy.intercept('GET', `${API}/savingsaccounts/3?*`, (req) => {
      req.reply({ fixture: accountState.fixture });
    }).as('getAccount');
  };

  beforeEach(() => {
    cy.stubApi();
    cy.intercept('GET', `${API}/clients/1`, { fixture: 'client' });
    cy.intercept('GET', `${API}/clients/1?*`, { fixture: 'client' });
    cy.intercept('GET', `${API}/datatables?apptable=m_savings_account`, []);
    cy.intercept('GET', `${API}/savingsaccounts/template?*`, { fixture: 'savings-template' });
    cy.intercept(
      { method: 'GET', url: `${API}/savingsaccounts/template?*`, query: { productId: '1' } },
      { fixture: 'savings-product-template' }
    ).as('productTemplate');
  });

  it('creates a savings account through the stepper', () => {
    cy.intercept('POST', `${API}/savingsaccounts`, { officeId: 1, clientId: 1, savingsId: 3, resourceId: 3 }).as(
      'createAccount'
    );
    stubAccount('savings-pending-approval');

    cy.visitAuthenticated('/#/clients/1/savings-accounts/create');
    cy.get('mat-horizontal-stepper').should('be.visible');
    cy.selectOption('productId', 'Passbook Savings');
    cy.wait('@productTemplate');
    cy.selectOption('fieldOfficerId', 'Officer, Alice');
    cy.get('input[formcontrolname="externalId"]').type('SAV-001');
    cy.stepperClick('Next');

    cy.get('input[formcontrolname="currencyCode"]').should('have.value', 'USD');
    cy.get('input[formcontrolname="nominalAnnualInterestRate"]').should('have.value', '5');
    cy.get('input[formcontrolname="minRequiredOpeningBalance"]').should('have.value', '100');
    cy.stepperClick('Next');

    cy.stepperClick('Next');

    cy.contains('Passbook Savings');
    cy.stepperClick('Submit');
    cy.wait('@createAccount')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ clientId: 1, productId: 1, externalId: 'SAV-001', fieldOfficerId: 1, locale: 'en' });
        expect(Number(body.nominalAnnualInterestRate)).to.eq(5);
        expect(body).to.have.property('submittedOnDate');
      });
    cy.url().should('include', accountUrl);
    cy.contains('Submitted and pending approval');
  });

  it('approves and activates a savings account', () => {
    stubAccount('savings-pending-approval');
    cy.intercept('POST', `${API}/savingsaccounts/3?command=approve`, (req) => {
      accountState.fixture = 'savings-approved';
      req.reply({ officeId: 1, clientId: 1, savingsId: 3, resourceId: 3 });
    }).as('approve');
    cy.intercept('POST', `${API}/savingsaccounts/3?command=activate`, (req) => {
      accountState.fixture = 'savings-active';
      req.reply({ officeId: 1, clientId: 1, savingsId: 3, resourceId: 3 });
    }).as('activate');

    cy.visitAuthenticated(`${accountUrl}/general`);
    cy.contains('Submitted and pending approval');
    cy.get('button[aria-label="Loan account actions"]').click();
    cy.get('.mat-menu-panel').contains('button', 'Approve').click();
    cy.url().should('include', `${accountUrl}/actions/Approve`);
    cy.pickToday('approvedOnDate');
    cy.get('textarea[formcontrolname="note"]').type('Approved via Cypress');
    cy.contains('form button', 'Confirm').click();
    cy.wait('@approve')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ note: 'Approved via Cypress', locale: 'en' });
        expect(body).to.have.property('approvedOnDate');
      });
    cy.url().should('include', `${accountUrl}/transactions`);
    cy.contains('Approved');

    cy.get('button[aria-label="Loan account actions"]').click();
    cy.get('.mat-menu-panel').contains('button', 'Activate').click();
    cy.url().should('include', `${accountUrl}/actions/Activate`);
    cy.pickToday('activatedOnDate');
    cy.contains('form button', 'Confirm').click();
    cy.wait('@activate').its('request.body').should('have.property', 'activatedOnDate');
    cy.url().should('include', `${accountUrl}/transactions`);
    cy.contains('Active');
  });

  it('makes a deposit into an active account and lists transactions', () => {
    stubAccount('savings-active');
    cy.intercept('GET', `${API}/savingsaccounts/3/transactions/template`, { fixture: 'savings-transaction-template' });
    cy.intercept('POST', `${API}/savingsaccounts/3/transactions?command=deposit`, {
      officeId: 1,
      clientId: 1,
      savingsId: 3,
      resourceId: 11
    }).as('deposit');

    cy.visitAuthenticated(`${accountUrl}/general`);
    cy.contains('Active');
    cy.contains('500.00');
    cy.get('button[aria-label="Loan account actions"]').click();
    cy.get('.mat-menu-panel').contains('button', 'Deposit').click();
    cy.url().should('include', `${accountUrl}/actions/Deposit`);

    cy.get('mifosx-input-amount input').type('{selectall}250');
    cy.selectOption('paymentTypeId', 'Cash');
    cy.get('textarea[formcontrolname="note"]').type('Cypress deposit');
    cy.contains('form button', 'Submit').click();
    cy.wait('@deposit')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ transactionAmount: 250, paymentTypeId: 1, note: 'Cypress deposit', locale: 'en' });
        expect(body).to.have.property('transactionDate');
      });

    cy.url().should('include', `${accountUrl}/transactions`);
    cy.get('table[mat-table] tbody tr')
      .should('have.length', 1)
      .first()
      .should('contain', 'Deposit')
      .and('contain', '500.00');
  });
});
