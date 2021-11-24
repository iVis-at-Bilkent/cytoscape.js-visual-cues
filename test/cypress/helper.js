export const DEMO_URL = 'http://localhost:8080/demo/demo.html';

export function open() {
  cy.visit(DEMO_URL);
}