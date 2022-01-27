import { open, cueSelector } from "../helper";

context("Test demo.html file", () => {
  beforeEach(() => {
    open();
  });

  it("Add cue, check cue data, then update cue 'position', 'show', 'marginX', 'marginY' options", () => {
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

  it("Add cue and then update 'zoom2hide' (zoom to hide)", () => {
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

    cy.get("input#cueId").clear();
    cy.get("input#cueId").type("imgCue");
    cy.get("select#posOpt").select("right");
    cy.get("select#imgElem").select("1");
    cy.get("button#addCue").click();

    // 'addCue' should add a new DOM element
    cy.get(cueSelector).contains("123").should("be.visible");
    cy.get('img[src="assets/edit.svg"]').should("be.visible");

    cy.get("input#cueId").clear();
    cy.get("button#removeCue").click();
    cy.wait(100);

    // cue should not exists
    cy.get(cueSelector).contains("123").should("not.exist");
  });

  it("Hiding element should hide the cue, deleting element should remove the cue", () => {
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

  it("Adding a cue with the same id should print an error", () => {
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

  it("Should be able to show/hide cue(s) manually", () => {
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

  it("Should update margins, z-index and, tooltip", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });

    // add cue
    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    let cueY1 = null;
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        cueY1 = el[0].getBoundingClientRect().y;
      });

    // update cue margins
    cy.get("input#marginX").type("100");
    cy.get("input#marginY").type("100");
    cy.get("input#tooltip").type("ankara");
    cy.get("input#zIndex").type("11");
    cy.get("button#updateCue").click();

    cy.get('div[title="ankara"]')
      .contains("123")
      .then((el) => {
        const cueY2 = el[0].getBoundingClientRect().y;
        expect(cueY1).to.not.equal(cueY2);
        expect(cueY1).to.be.lt(cueY2);
      });

    cy.get('div[title="ankara"]').should("have.css", "z-index", "11");
  });

  it("Cues should follow the attached graph element on zoom, pan and position events", () => {
    cy.window().then((win) => {
      win.cy.$("#n20").select();
    });
    cy.wait(2000);

    cy.get("input#isFixedSize").uncheck();
    cy.get("input#cueId").type("newCue");
    cy.get("input#htmlElem").type("123");
    cy.get("button#addCue").click();

    let cuePos0 = null;
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        cuePos0 = el[0].getBoundingClientRect();
      });

    cy.wait(100);
    let elemPos0 = null;
    cy.window().then((win) => {
      elemPos0 = win.cy.$("#n20").renderedPosition();
      win.cy.zoom(0.5);
    });
    cy.wait(100);

    let cuePos1 = null;
    cy.get(cueSelector)
      .contains("123")
      .then((el) => {
        cuePos1 = el[0].getBoundingClientRect();
      });

    let elemPos1 = null;
    cy.window().then((win) => {
      elemPos1 = win.cy.$("#n20").renderedPosition();
      const deltaX1 = elemPos0.x - cuePos0.x;
      const deltaY1 = elemPos0.y - cuePos0.y;
      const deltaX2 = elemPos1.x - cuePos1.x;
      const deltaY2 = elemPos1.y - cuePos1.y;
      expect(deltaX1 - deltaX2).to.be.closeTo(0, 50);
      expect(deltaY1 - deltaY2).to.be.closeTo(0, 50);
    });
  });
});
