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
      generateBadge4Elem(e, r.degree);
    }
  });

  function generateBadge4Elem(e, badge) {
    const div = document.createElement("div");
    div.innerHTML = `<span class="badge rounded-pill bg-primary">${badge}</span>`;
    e.addCue({ show: "always", position: "bottom", htmlElem: div });
  }
}
