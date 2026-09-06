import { API } from '../support/commands';

describe('Loans', () => {
  const loanUrl = '/#/clients/1/loans-accounts/2';
  const loanState = { fixture: 'loan-pending-approval' };
  const stubLoan = (fixture: string) => {
    loanState.fixture = fixture;
    cy.intercept('GET', `${API}/loans/2?*`, (req) => {
      req.reply({ fixture: loanState.fixture });
    }).as('getLoan');
  };

  beforeEach(() => {
    cy.stubApi();
    cy.intercept('GET', `${API}/clients/1`, { fixture: 'client' });
    cy.intercept('GET', `${API}/clients/1?*`, { fixture: 'client' });
    cy.intercept('GET', `${API}/clients/1/collaterals/template`, []);
    cy.intercept('GET', `${API}/datatables?apptable=m_loan`, []);
    cy.intercept('GET', `${API}/loans/template?*`, { fixture: 'loan-template' });
    cy.intercept(
      { method: 'GET', url: `${API}/loans/template?*`, query: { productId: '1' } },
      { fixture: 'loan-product-template' }
    ).as('productTemplate');
  });

  it('applies for a loan through the stepper and generates the schedule', () => {
    cy.fixture('loan-pending-approval').then((loan) => {
      cy.intercept('POST', `${API}/loans?command=calculateLoanSchedule`, loan.repaymentSchedule).as(
        'calculateSchedule'
      );
    });
    cy.intercept('POST', `${API}/loans`, { officeId: 1, clientId: 1, loanId: 2, resourceId: 2 }).as('createLoan');
    cy.intercept('GET', `${API}/loans/2?*`, { fixture: 'loan-pending-approval' }).as('getLoan');

    cy.visitAuthenticated('/#/clients/1/loans-accounts/create');
    cy.get('mat-horizontal-stepper').should('be.visible');

    cy.selectOption('productId', 'Personal Loan');
    cy.wait('@productTemplate');
    cy.selectOption('loanOfficerId', 'Officer, Alice');
    cy.selectOption('loanPurposeId', 'Working capital');
    cy.pickToday('expectedDisbursementDate');
    cy.stepperClick('Next');

    cy.get('mifosx-input-amount input').first().as('principal').should('have.value', '10000');
    cy.get('input[formcontrolname="numberOfRepayments"]').should('have.value', '12');
    cy.get('input[formcontrolname="interestRatePerPeriod"]').should('have.value', '12');
    cy.get('@principal').type('{selectall}15000');
    cy.get('input[formcontrolname="numberOfRepayments"]').type('{selectall}10');
    cy.get('input[formcontrolname="loanTermFrequency"]').should('have.value', '10');
    cy.stepperClick('Next');

    cy.stepperClick('Next');

    cy.stepperClick('Generate Repayment Schedule');
    cy.wait('@calculateSchedule')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ clientId: 1, productId: 1, numberOfRepayments: 10, loanTermFrequency: 10 });
        expect(Number(body.principal)).to.eq(15000);
      });
    cy.get('mifosx-repayment-schedule-tab table').should('be.visible').and('contain', '788.49');
    cy.stepperClick('Next');

    cy.contains('h3', 'Details').should('be.visible');
    cy.contains('Personal Loan');
    cy.stepperClick('Submit');
    cy.wait('@createLoan')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ clientId: 1, productId: 1, loanType: 'individual' });
        expect(Number(body.principal)).to.eq(15000);
        expect(body).to.have.property('expectedDisbursementDate');
        expect(body).to.have.property('submittedOnDate');
      });
    cy.url().should('include', `${loanUrl}/general`);
    cy.contains('Submitted and pending approval');
  });

  it('approves a pending loan', () => {
    stubLoan('loan-pending-approval');
    cy.intercept('GET', `${API}/loans/2/template?templateType=approval`, { fixture: 'loan-approval-template' });
    cy.intercept('POST', `${API}/loans/2?command=approve`, (req) => {
      loanState.fixture = 'loan-approved';
      req.reply({ officeId: 1, clientId: 1, loanId: 2, resourceId: 2 });
    }).as('approve');

    cy.visitAuthenticated(`${loanUrl}/general`);
    cy.contains('Submitted and pending approval');
    cy.get('button[aria-label="Loan account actions"]').click();
    cy.get('.mat-menu-panel').contains('button', 'Approve').click();
    cy.url().should('include', `${loanUrl}/actions/Approve`);

    cy.get('mifosx-input-amount input').should('have.value', '$10,000.00');
    cy.get('textarea[formcontrolname="note"]').type('Approved via Cypress');
    cy.contains('form button', 'Submit').click();

    cy.wait('@approve')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ approvedLoanAmount: 10000, note: 'Approved via Cypress', locale: 'en' });
        expect(body).to.have.property('approvedOnDate');
      });
    cy.url().should('include', `${loanUrl}/general`);
    cy.contains('Approved');
  });

  it('disburses an approved loan', () => {
    stubLoan('loan-approved');
    cy.intercept('GET', `${API}/loans/2/transactions/template?command=disburse`, { fixture: 'loan-disburse-template' });
    cy.intercept('POST', `${API}/loans/2?command=disburse`, (req) => {
      loanState.fixture = 'loan-active';
      req.reply({ officeId: 1, clientId: 1, loanId: 2, resourceId: 1 });
    }).as('disburse');

    cy.visitAuthenticated(`${loanUrl}/general`);
    cy.contains('Approved');
    cy.get('button[aria-label="Loan account actions"]').click();
    cy.get('.mat-menu-panel').contains('button', 'Disburse').scrollIntoView().click();
    cy.url().should('include', `${loanUrl}/actions/Disburse`);

    cy.get('mifosx-input-amount input').should('have.value', '$10,000.00');
    cy.selectOption('paymentTypeId', 'Cash');
    cy.contains('form button', 'Submit').click();

    cy.wait('@disburse')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({ transactionAmount: 10000, paymentTypeId: 1, locale: 'en' });
        expect(body).to.have.property('actualDisbursementDate');
      });
    cy.url().should('include', `${loanUrl}/general`);
    cy.contains('Active');
    cy.contains('Disbursement');
  });
});
