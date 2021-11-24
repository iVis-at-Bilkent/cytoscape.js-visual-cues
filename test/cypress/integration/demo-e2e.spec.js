import { open } from '../helper';

context('Test demo.html file', () => {

  beforeEach(() => {
    open();
  });

  it('A sample test to check if cy instance is available', () => {
    cy.window().then((win) => {
      expect(win.cy).to.not.equal(null);
      expect(win.cy).to.not.equal(undefined);
      const nodes = win.cy.nodes();
      expect(nodes).to.not.equal(null);
      expect(nodes).to.not.equal(undefined);
    });
  });

});