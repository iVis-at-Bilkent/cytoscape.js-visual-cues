import { open, cueSelector } from "../helper";

context("Test demo.html file", () => {
  beforeEach(() => {
    open();
  });

  it("Add cue and then update cue position and show type", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    // 'addCue' should add a new DOM element
    cy.get(cueSelector).contains("123").should("be.visible");

    // check cue data
    cy.get("button#getCueData").click();
    cy.get("code#cueData").contains("newCue").should("exist");

    let cueTopRectY = null;
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        cueTopRectY = el[0].getBoundingClientRect().y;
      });

    // update cue position
    cy.get("select#posOpt").select("bottom");
    cy.get("button#updateCue").click();

    let cueBottomRect = null;
    cy.wait(100);
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        cueBottomRect = el[0].getBoundingClientRect();
        expect(cueBottomRect.y).to.be.gt(cueTopRectY);
      });

    // update cue margins
    cy.get("input#marginX").type("%40");
    cy.get("input#marginY").type("%40");
    cy.get("button#updateCue").click();
    cy.wait(100);

    cy.wait(100);
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        let cueBottomRect2 = el[0].getBoundingClientRect();
        expect(cueBottomRect2.y).to.be.gt(cueBottomRect.y);
        expect(cueBottomRect2.x).to.be.gt(cueBottomRect.x);
      });

    // update cue show setting
    cy.get("select#showOpt").select("select");
    cy.get("button#updateCue").click();
    cy.wait(100);

    cy.window().then((win) => {
      win.cy.$("#n20").unselect();
    });
    cy.wait(100);

    // should be invisible
    cy.get(cueSelector).contains("123").should("not.be.visible");

    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });
    cy.wait(100);

    // should be visible
    cy.get(cueSelector).contains("123").should("be.visible");
  });

  it("Add cue and then update 'zoom to hide'", () => {
    let zoom = 0;
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    // 'addCue' should add a new DOM element
    cy.get(cueSelector).contains("123").should("be.visible");

    // update 'zoom to hide' setting
    cy.get("input#zoom2hide").type("2");
    cy.get("button#updateCue").click();
    cy.wait(100);

    cy.window().then((win) => {
      win.cy.zoom(1.5);
    });
    cy.wait(100);

    // cue should be hidden
    cy.get(cueSelector).contains("123").should("not.be.visible");
  });

  it("Add cue and then remove cue", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    // 'addCue' should add a new DOM element
    cy.get(cueSelector).contains("123").should("be.visible");

    cy.get("button#removeCue").click();
    cy.wait(100);

    // cue should not exists
    cy.get(cueSelector).contains("123").should("not.exist");
  });

  it("Hiding element will hide the cue, deleting element will remove the cue", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    // 'addCue' should add a new DOM element
    cy.get(cueSelector).contains("123").should("be.visible");

    // hide the graph element
    cy.window().then((win) => {
      win.cy.$("#n20").css("visibility", "hidden");
    });
    cy.wait(100);
    // cue should be invisible
    cy.get(cueSelector).contains("123").should("not.be.visible");

    // show the graph element
    cy.window().then((win) => {
      win.cy.$("#n20").css("visibility", "visible");
    });
    cy.wait(100);
    // cue should be invisible
    cy.get(cueSelector).contains("123").should("be.visible");

    // delete the graph element
    cy.window().then((win) => {
      win.cy.$("#n20").remove();
    });
    cy.wait(100);
    // cue should not exists
    cy.get(cueSelector).contains("123").should("not.exist");
  });

  it("Adding the same cue id should print an error", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    cy.get(cueSelector).contains("123").should("have.length", 1);

    cy.get("button#addCue").click();

    cy.get(cueSelector).contains("123").should("have.length", 1);

    cy.get("@consoleError").should(
      "be.calledWith",
      "A cue with id 'newCue' already exists for 'n20'"
    );
  });

  it("Can be able to show/hide cue(s) manually", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    cy.get(cueSelector).contains("123").should("be.visible");
    cy.get("button#hideCue").click();
    cy.get(cueSelector).contains("123").should("not.be.visible");
    cy.get("button#showCue").click();
    cy.get(cueSelector).contains("123").should("be.visible");
  });
});
