document.addEventListener("DOMContentLoaded", onLoaded);

function onLoaded() {
  const cy = (window.cy = cytoscape({
    container: document.getElementById("cy"),
    wheelSensitivity: 0.1,
    style: [
      {
        selector: "node",
        style: {
          label: "data(id)",
        },
      },
      {
        selector: "edge",
        style: {
          label: (x) => {
            if (x.data("edgeType")) {
              return x.data("edgeType");
            }
            return "";
          },
        },
      },
    ],
  }));

  cy.layoutUtilities({ desiredAspectRatio: cy.width() / cy.height() });

  // change the below code to get an instance of your own extension
  // const api = cy.visualCues();

  loadSample("sampleGraph50");

  document.getElementById("degreeCentrality").addEventListener("click", () => {
    const elems = cy.nodes();
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      const r = cy.$().degreeCentrality({ root: e });
      buildCue4Elem(e, r.degree);
    }
  });

  document.getElementById("deleteSelected").addEventListener("click", () => {
    cy.$(":selected").remove();
  });

  document.getElementById("hideSelected").addEventListener("click", () => {
    cy.$(":selected").css("visibility", "hidden");
    const hiddenNodes = cy.nodes(":hidden");
    for (let i = 0; i < hiddenNodes.length; i++) {
      hiddenNodes[i].connectedEdges().css("visibility", "hidden");
    }
  });

  document.getElementById("showAllHidden").addEventListener("click", () => {
    cy.$(":hidden").css("visibility", "visible");
  });

  document.getElementById("addCue").addEventListener("click", () => {
    let options = {
      id: document.getElementById("cueId").value,
      show: document.getElementById("showOpt").value,
      position: document.getElementById("posOpt").value,
      marginX: document.getElementById("marginX").value,
      marginY: document.getElementById("marginY").value,
      zoom2hide: document.getElementById("zoom2hide").value,
      isFixedSize: document.getElementById("isFixedSize").checked,
      zIndex: document.getElementById("zIndex").checked,
    };
    const htmlElem = document.getElementById("htmlElem").value;
    if (htmlElem && htmlElem.length > 0) {
      const div = document.createElement("div");
      div.innerHTML = `<span class="badge rounded-pill bg-primary">${htmlElem}</span>`;
      options.htmlElem = div;
    }

    const imgElemOpt = document.getElementById("imgElem").value;
    if (imgElemOpt == "1") {
      options.imgData = { width: 16, height: 16, src: "assets/edit.svg" };
    } else if (imgElemOpt == "2") {
      options.imgData = { width: 16, height: 16, src: "assets/close.svg" };
    } else if (imgElemOpt == "3") {
      options.imgData = { width: 16, height: 16, src: "assets/add.svg" };
    }

    const elems = cy.$(":selected");
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      e.addCue(options);
    }
  });

  function buildCue4Elem(e, badge) {
    const div = document.createElement("div");
    div.innerHTML = `<span class="badge rounded-pill bg-primary">${badge}</span>`;
    e.addCue({ show: "always", position: "bottom", htmlElem: div });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key == "Delete") {
      cy.$(":selected").remove();
    }
  });

  const n = cy.nodes()[0];
  const div = document.createElement("div");
  div.innerHTML = `<span class="badge rounded-pill bg-primary">12</span>`;
  n.addCue({ htmlElem: div, position: "top" });
  n.addCue({ htmlElem: div, position: "bottom" });
  n.addCue({ htmlElem: div, position: "right" });
  n.addCue({ htmlElem: div, position: "left" });
  n.addCue({ htmlElem: div, position: "center" });
  n.addCue({ htmlElem: div, position: "top-left" });
  n.addCue({ htmlElem: div, position: "top-right" });
  n.addCue({ htmlElem: div, position: "bottom-right" });
  n.addCue({ htmlElem: div, position: "bottom-left" });
}
