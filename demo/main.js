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
  
  loadSample('sampleGraph50');
}
