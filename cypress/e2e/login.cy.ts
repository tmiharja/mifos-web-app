import { API } from '../support/commands';

describe('Login', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('renders the login page', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.get('input[formcontrolname="username"]').should('be.visible');
    cy.get('input[formcontrolname="password"]').should('be.visible');
    cy.contains('button', 'Login').should('be.disabled');
    cy.contains('Remember me');
  });

  it('shows an error for invalid credentials', () => {
    cy.intercept('POST', `${API}/authentication`, {
      statusCode: 401,
      body: { developerMessage: 'Invalid authentication details were passed in api request.' }
    });
    cy.visit('/#/login');
    cy.loginViaUi('mifos', 'wrong-password');
    cy.contains('Invalid User Details').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('logs in and lands on the home page', () => {
    cy.visit('/#/login');
    cy.loginViaUi();
    cy.wait('@authentication').its('request.body').should('deep.equal', { username: 'mifos', password: 'password' });
    cy.url().should('include', '/home');
    cy.get('mifosx-warning-dialog').should('be.visible').find('button').click();
    cy.contains('Welcome, mifos!');
    cy.window().its('sessionStorage').invoke('getItem', 'mifosXCredentials').should('contain', '"username":"mifos"');
  });

  it('logs out and clears the session', () => {
    cy.visitAuthenticated('/#/clients');
    cy.get('.img-button').click();
    cy.get('#logout').click();
    cy.url().should('include', '/login');
    cy.get('input[formcontrolname="username"]').should('be.visible');
    cy.window().its('sessionStorage').invoke('getItem', 'mifosXCredentials').should('be.null');
  });
});
