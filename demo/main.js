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

    cy.$(":selected").addCue(options);
  });

  document.getElementById("updateCue").addEventListener("click", () => {
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

    cy.$(":selected").updateCue(options);
  });

  document.getElementById("removeCue").addEventListener("click", () => {
    const id = document.getElementById("cueId").value;
    if (id) {
      cy.$(":selected").removeCue(id);
    } else {
      cy.$(":selected").removeCue();
    }
  });

  function buildCue4Elem(e, badge) {
    const div = document.createElement("div");
    div.innerHTML = `<span class="badge rounded-pill bg-primary">${badge}</span>`;
    e.addCue({ show: "always", position: "bottom", htmlElem: div });
  }

  document.addEventListener("keydown", function (e) {
    const activeElement = document.activeElement;
    if (activeElement.value && activeElement.value.length > 0) {
      return;
    }
    if (e.key == "Delete") {
      cy.$(":selected").remove();
    }
  });

  const e = cy.edges()[0];
  const div = document.createElement("div");
  div.innerHTML = `<span class="badge rounded-pill bg-primary">12</span>`;

  const fn = () => {
    console.log("asd");
  };
  // n.addCue({ htmlElem: div, position: "center" });
  e.addCue({
    htmlElem: div,
    position: "target",
    onCueClicked: fn,
    zIndex: 100,
    show: "select",
  });
  e.addCue({
    htmlElem: div,
    position: "source",
    onCueClicked: fn,
    zIndex: 100,
    show: "hover",
  });
  e.addCue({
    htmlElem: div,
    position: "center",
    zIndex: 100,
  });

  const n = cy.nodes()[0];
  n.addCue({ htmlElem: div, position: "top", onCueClicked: fn, zIndex: 100 });
  n.addCue({
    htmlElem: div,
    position: "bottom",
    onCueClicked: fn,
    zIndex: 100,
    isFixedSize: true,
  });
  n.addCue({ htmlElem: div, position: "right", onCueClicked: fn, zIndex: 100 });
  n.addCue({ htmlElem: div, position: "left", onCueClicked: fn, zIndex: 100 });
  n.addCue({
    htmlElem: div,
    position: "center",
    onCueClicked: fn,
    zIndex: 100,
  });
  n.addCue({
    htmlElem: div,
    position: "top-left",
    onCueClicked: fn,
    zIndex: 100,
  });
  n.addCue({
    htmlElem: div,
    position: "top-right",
    onCueClicked: fn,
    zIndex: 100,
    zoom2hide: 3,
  });
  n.addCue({
    htmlElem: div,
    position: "bottom-right",
    onCueClicked: fn,
    zIndex: 100,
    zoom2hide: 2,
  });
  n.addCue({
    htmlElem: div,
    position: "bottom-left",
    onCueClicked: fn,
    zIndex: 100,
    zoom2hide: 1,
  });
}
