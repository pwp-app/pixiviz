// https://docs.cypress.io/api/introduction/api.html

// alias
const test = it;

describe('Test landing link click', () => {
  // tests
  test('Search box behaviour', () => {
    cy.intercept('GET', 'pixiviz/announcement.json', []);
    cy.intercept('GET', 'api/v1/illust/search').as('search');
    cy.intercept('GET', 'api/v1/search/suggestions').as('suggestions');
    cy.visit('/');
    cy.get('.searchbox-input')
      .find('.el-input')
      .find('input')
      .type('miku')
      .should('have.value', 'miku');
    cy.get('.searchbox-button').click();
    cy.wait(300);
    cy.url().should('include', 'search/miku');
    cy.get('.search-header-input')
      .find('.el-input')
      .find('input')
      .should('have.value', 'miku');
    cy.wait(['@search', '@suggestions'], {
      timeout: 10000,
    });
    cy.get('.search-suggestion-items').should('be.visible');
    cy.get('.search-header-close').click();
    cy.url().should('not.include', 'search/miku');
    cy.wait(300);
    cy.get('.banner').should('be.visible');
  });
  test('Rank box behaviour', () => {
    cy.intercept('GET', 'pixiviz/announcement.json', []);
    cy.intercept('GET', 'api/v1/illust/rank').as('rank');
    cy.visit('/');
    cy.get('.rankbox')
      .find('.rankbox-options')
      .find('[data-mode="month"]')
      .click();
    cy.url().should('include', 'rank');
    cy.wait(300);
    cy.get('.rank-header-title-category')
      .find('span')
      .first()
      .should('have.text', '月排行榜');
    cy.get('.rank-header-close').click();
    cy.url().should('not.include', 'rank');
    cy.wait(300);
    cy.get('.banner').should('be.visible');
    cy.get('.rankbox')
      .find('.rankbox-options')
      .find('[data-mode="week"]')
      .click();
    cy.url().should('include', 'rank');
    cy.wait(300);
    cy.get('.rank-header-title-category')
      .find('span')
      .first()
      .should('have.text', '周排行榜');
    cy.get('.rank-header-close').click();
    cy.url().should('not.include', 'rank');
    cy.wait(300);
    cy.get('.banner').should('be.visible');
    cy.get('.rankbox')
      .find('.rankbox-options')
      .find('[data-mode="day"]')
      .click();
    cy.url().should('include', 'rank');
    cy.wait(300);
    cy.get('.rank-header-title-category')
      .find('span')
      .first()
      .should('have.text', '日排行榜');
    cy.get('.rank-header-close').click();
    cy.url().should('not.include', 'rank');
    cy.wait(300);
    cy.get('.banner').should('be.visible');
  });
  test('Banner box behaviour', () => {
    cy.intercept('GET', 'pixiviz/announcement.json', []);
    cy.clearLocalStorage();
    cy.visit('/');
    cy.get('.banner').dblclick();
    cy.wait(2000);
    cy.get('.about').should('be.visible');
    cy.get('#about-theme').click();
    cy.wait(300);
    cy.get('#landing-dialog-theme').should('be.visible');
    cy.get('#landing-dialog-theme')
      .find('.el-switch')
      .each((el) => {
        cy.wrap(el).click();
      });
    cy.wait(500);
    cy.get('html').should('have.class', 'dark');
    cy.get('#landing-dialog-theme')
      .find('.el-switch')
      .first()
      .click();
    cy.wait(500);
    cy.get('html').should('not.have.class', 'dark');
    cy.get('#landing-dialog-theme').click();
    cy.wait(300);
    cy.get('#about-history').click();
    cy.url().should('include', 'history');
  });
  test('Announcement behaviour', () => {
    cy.intercept('GET', 'pixiviz/announcement.json', { fixture: 'testAnnouncement.json' }).as(
      'testReq',
    );
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(['@testReq']);
    cy.wait(300);
    cy.get('.landing-announcement').should('be.visible');
  });
});
