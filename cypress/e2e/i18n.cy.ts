describe('i18n language switch', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('switches the login page language and back', () => {
    cy.visit('/#/login');
    cy.contains('button', 'Login').should('be.visible');
    cy.contains('mat-label', 'Password').should('exist');

    cy.get('mifosx-language-selector mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('Español').click();

    cy.contains('button', 'Acceso').should('be.visible');
    cy.contains('mat-label', 'Contraseña').should('exist');
    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('mifosXLanguage'))).to.include({ code: 'es' });
    });

    cy.get('mifosx-language-selector mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('English').click();
    cy.contains('button', 'Login').should('be.visible');
  });

  it('switches the language from the toolbar when authenticated', () => {
    cy.viewport(1400, 900);
    cy.visitAuthenticated('/#/home');
    cy.get('mat-dialog-container').should('be.visible').find('button[mat-dialog-close]').click();
    cy.get('mat-dialog-container').should('not.exist');
    cy.contains('mifosx-toolbar', 'Institution').should('be.visible');

    cy.get('mifosx-toolbar mifosx-language-selector mat-select').click();
    cy.get('.cdk-overlay-pane mat-option').contains('Español').click();
    cy.contains('mifosx-toolbar', 'Institución').should('be.visible');
    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('mifosXLanguage'))).to.include({ code: 'es' });
    });
  });
});
