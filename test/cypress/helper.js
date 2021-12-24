export const DEMO_URL = "http://localhost:8080/demo/demo.html";

export function open() {
  cy.visit(DEMO_URL, {
    onBeforeLoad(win) {
      cy.stub(win.console, "log").as("consoleLog");
      cy.stub(win.console, "error").as("consoleError");
    },
  });
}

export const cueSelector = "span.badge.rounded-pill.bg-primary";