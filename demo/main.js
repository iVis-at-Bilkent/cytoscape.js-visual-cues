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
          "text-valign": "center",
          "font-size": "11px",
          color: "white",
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
      {
        selector: "node.rect",
        style: {
          shape: "rectangle",
        },
      },
      {
        selector: "node.barrel",
        style: {
          shape: "round-octagon",
          "text-valign": "bottom",
          color: "black",
        },
      },
      {
        selector: "node.circle",
        style: {
          shape: "ellipse",
        },
      },
      {
        selector: "edge.solid",
        style: {
          "line-style": "solid",
        },
      },
      {
        selector: "edge.dashed",
        style: {
          "line-style": "dashed",
        },
      },
      {
        selector: ":selected",
        style: {
          "background-color": "#a1887f",
        },
      },
      {
        selector: ":parent",
        style: {
          "background-opacity": 0.2,
        },
      },
      {
        selector: "edge:selected",
        style: {
          "line-color": "#a1887f",
        },
      },
      {
        selector: "edge.2bended",
        style: {
          "segment-distances": "10px -10px",
          "segment-weights": "0.2 0.4",
          "curve-style": "segments",
        },
      },
      {
        selector: "edge.1bended",
        style: {
          "segment-distances": "40px",
          "segment-weights": "0.8",
          "curve-style": "segments",
        },
      },
      {
        selector: "edge.1control",
        style: {
          "control-point-distances": "40px",
          "control-point-weights": "0.3",
          "curve-style": "unbundled-bezier",
        },
      },
      {
        selector: "edge.2control",
        style: {
          "control-point-distances": "40px -40px",
          "control-point-weights": "0.2 0.8",
          "curve-style": "unbundled-bezier",
        },
      },
      {
        selector: "edge.3control",
        style: {
          "control-point-distances": "40px -60px 80px",
          "control-point-weights": "0.2 0.6 0.8",
          "curve-style": "unbundled-bezier",
        },
      },
    ],
  }));

  let toastList = [];
  let layoutUtils = cy.layoutUtilities({
    desiredAspectRatio: cy.width() / cy.height(),
  });
  window.graph4cues = {
    nodes: [
      { data: { id: "n18" }, classes: "barrel" },
      { data: { id: "n19" }, classes: "barrel" },
      { data: { id: "n20" }, classes: "barrel" },
      { data: { id: "n1", parent: "c0" }, classes: "rect" },
      { data: { id: "n2", parent: "c0" }, classes: "circle" },
      { data: { id: "n3", parent: "c0" }, classes: "rect" },
      { data: { id: "n4", parent: "c0" }, classes: "rect" },
      { data: { id: "n5", parent: "c0" }, classes: "circle" },
      { data: { id: "n6", parent: "c0" }, classes: "circle" },
      { data: { id: "n7", parent: "c0" }, classes: "circle" },
      { data: { id: "n8" }, classes: "rect" },
      { data: { id: "n9" }, classes: "rect" },
      { data: { id: "n10" }, classes: "circle" },
      { data: { id: "n11" }, classes: "rect" },
      { data: { id: "n12" }, classes: "circle" },
      { data: { id: "n13" }, classes: "rect" },
      { data: { id: "n14" }, classes: "circle" },
      { data: { id: "n15" }, classes: "rect" },
      { data: { id: "n16" }, classes: "circle" },
      { data: { id: "n17" }, classes: "circle" },
      { data: { id: "c0" }, classes: "barrel" },
    ],
    edges: [
      { data: { source: "n19", target: "n20" }, classes: "solid 3control" },
      { data: { source: "n1", target: "n2" }, classes: "dashed" },
      { data: { source: "n1", target: "n3" }, classes: "solid" },
      { data: { source: "n2", target: "n3" }, classes: "dashed" },
      { data: { source: "n3", target: "n4" }, classes: "solid" },
      { data: { source: "n4", target: "n5" }, classes: "dashed" },
      { data: { source: "n3", target: "n6" }, classes: "solid" },
      { data: { source: "n2", target: "n7" }, classes: "dashed" },
      { data: { source: "n3", target: "n7" }, classes: "solid" },
      { data: { source: "n5", target: "n6" }, classes: "dashed" },
      { data: { source: "n6", target: "n7" }, classes: "solid" },
      { data: { source: "n6", target: "n8" }, classes: "dashed" },
      { data: { source: "n8", target: "n9" }, classes: "solid 1control" },
      { data: { source: "n8", target: "n10" }, classes: "dashed" },
      { data: { source: "n8", target: "n11" }, classes: "solid" },
      { data: { source: "n9", target: "n11" }, classes: "dashed" },
      { data: { source: "n11", target: "n12" }, classes: "solid" },
      { data: { source: "n11", target: "n13" }, classes: "solid 2bended" },
      { data: { source: "n11", target: "n14" }, classes: "solid 2control" },
      { data: { source: "n13", target: "n15" }, classes: "dashed" },
      { data: { source: "n13", target: "n16" }, classes: "solid" },
      { data: { source: "n15", target: "n16" }, classes: "dashed" },
      { data: { source: "n15", target: "n17" }, classes: "dashed 1bended" },
    ],
  };
  const IMG_SIZE = 24;
  loadSample("graph4cues");
  initToasts();
  hideSomeNodes();
  setTimeout(() => {
    addSampleCues();
    updateCues();
  }, 500);

  document.getElementById("degreeCentrality").addEventListener("click", () => {
    const elems = cy.nodes(":visible");
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      const r = cy.$().degreeCentrality({ root: e });
      buildCue4Elem(e, r.degree);
    }
  });

  document.getElementById("recalculateLayout").addEventListener("click", () => {
    cy.$(":visible")
      .layout({ name: "fcose", animate: true, randomize: true })
      .run();
  });

  document.getElementById("deleteSelected").addEventListener("click", () => {
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    cy.$(":selected").remove();
    updateCues();
  });

  document.getElementById("hideSelected").addEventListener("click", () => {
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    cy.$(":selected").css("visibility", "hidden");
    const hiddenNodes = cy.nodes(":hidden");
    for (let i = 0; i < hiddenNodes.length; i++) {
      hiddenNodes[i].connectedEdges().css("visibility", "hidden");
    }
    if (hiddenNodes.length > 0) {
      runLayoutThenUpdateCues();
    }
  });

  document.getElementById("showAllHidden").addEventListener("click", () => {
    const hiddenCount = cy.$(":hidden").length;
    cy.$(":hidden").css("visibility", "visible");
    if (hiddenCount > 0) {
      runLayoutThenUpdateCues();
    }
  });

  document.getElementById("addCue").addEventListener("click", () => {
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    let options = {
      id: document.getElementById("cueId").value,
      show: document.getElementById("showOpt").value,
      position: document.getElementById("posOpt").value,
      marginX: document.getElementById("marginX").value,
      marginY: document.getElementById("marginY").value,
      zoom2hide: document.getElementById("zoom2hide").value,
      isFixedSize: document.getElementById("isFixedSize").checked,
      zIndex: document.getElementById("zIndex").checked,
      tooltip: document.getElementById("tooltip").value,
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
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    let options = {
      id: document.getElementById("cueId").value,
      show: document.getElementById("showOpt").value,
      position: document.getElementById("posOpt").value,
      marginX: document.getElementById("marginX").value,
      marginY: document.getElementById("marginY").value,
      zoom2hide: document.getElementById("zoom2hide").value,
      isFixedSize: document.getElementById("isFixedSize").checked,
      zIndex: document.getElementById("zIndex").checked,
      tooltip: document.getElementById("tooltip").value,
    };
    cy.$(":selected").updateCue(options);
  });

  document.getElementById("removeCue").addEventListener("click", () => {
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    const id = document.getElementById("cueId").value;
    if (id) {
      cy.$(":selected").removeCue(id);
    } else {
      cy.$(":selected").removeCue();
    }
  });

  document.getElementById("getCueData").addEventListener("click", () => {
    if (!haveAnySelected()) {
      toastList[0].show();
      return;
    }
    document.getElementById("cueDataContainer").style.display = "block";
    const data = cy.$(":selected").getCueData();
    const str = JSON.stringify(data, null, 4);
    document.getElementById("cueData").innerHTML = str;
  });

  document.getElementById("closeCueData").addEventListener("click", () => {
    document.getElementById("cueData").innerHTML = "";
    document.getElementById("cueDataContainer").style.display = "none";
  });

  function buildCue4Elem(e, badge) {
    const div = document.createElement("div");
    div.innerHTML = `<span class="badge rounded-pill bg-info">${badge}</span>`;
    let pos = "bottom";
    if (e.hasClass("circle")) {
      pos = "bottom-right";
    }
    e.addCue({ show: "always", position: pos, htmlElem: div });
  }

  function haveAnySelected() {
    return cy.$(":selected").length > 0;
  }

  function initToasts() {
    let toastElList = [].slice.call(document.querySelectorAll(".toast"));
    toastList = toastElList.map(function (toastEl) {
      return new bootstrap.Toast(toastEl);
    });
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

  function addSampleCues() {
    const e = cy.edges()[0];
    const div = document.createElement("div");
    div.innerHTML = `<span title="tooltip" class="badge rounded-pill bg-primary">3</span>`;

    const fn = () => {
      console.log("asd");
    };
    const edgeCues = [
      { position: "target", show: "select" },
      { position: "source", show: "hover" },
      { position: "center", show: "always" },
    ];
    for (let i = 0; i < edgeCues.length; i++) {
      e.addCue({
        htmlElem: div,
        position: edgeCues[i].position,
        onCueClicked: fn,
        zIndex: 100,
        show: edgeCues[i].show,
      });
    }

    const e2 = cy.edges(".2bended, .1bended, .2control, .1control");
    const positions = ["target", "source", "center"];
    for (let i = 0; i < positions.length; i++) {
      e2.addCue({
        htmlElem: div,
        position: edgeCues[i].position,
        onCueClicked: fn,
        zIndex: 100,
      });
    }

    const n = cy.nodes()[0];
    n.addCue({ htmlElem: div, position: "top", onCueClicked: fn, zIndex: 100 });
    n.addCue({
      htmlElem: div,
      position: "bottom",
      onCueClicked: fn,
      zIndex: 100,
      isFixedSize: true,
    });
    n.addCue({
      htmlElem: div,
      position: "right",
      onCueClicked: fn,
      zIndex: 100,
    });
    n.addCue({
      htmlElem: div,
      position: "left",
      onCueClicked: fn,
      zIndex: 100,
    });
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

  function hideSomeNodes() {
    const nodeIds = ["n2", "n7", "n16", "n5", "n12"];
    for (const id of nodeIds) {
      cy.nodes("#" + id).css("visibility", "hidden");
      cy.nodes("#" + id)
        .connectedEdges()
        .css("visibility", "hidden");
    }
  }

  function showDashedNei(e) {
    const edges = e.neighborhood("edge.dashed:hidden");
    if (edges.length < 1) {
      return;
    }
    // layoutUtils.placeNewNodes(edges.connectedNodes(":hidden"));
    edges.css("visibility", "visible");
    edges.connectedNodes().css("visibility", "visible");
    runLayoutThenUpdateCues();
  }

  function runLayoutThenUpdateCues() {
    cy.$(":visible")
      .layout({
        name: "fcose",
        animate: true,
        randomize: false,
        stop: updateCues,
      })
      .run();
  }

  function hideDashedNei(e) {
    const edges = e.neighborhood("edge.dashed:visible");
    if (edges.length < 1) {
      return;
    }
    // layoutUtils.placeNewNodes(edges.connectedNodes(":hidden"));
    edges.css("visibility", "hidden");
    const nodes2hide = edges.connectedNodes().not(e);
    nodes2hide.css("visibility", "hidden");
    nodes2hide.connectedEdges().css("visibility", "hidden");
    runLayoutThenUpdateCues();
  }

  function showNei(e) {
    if (e.neighborhood(":hidden").length < 1) {
      return;
    }
    // layoutUtils.placeNewNodes(e.neighborhood(":hidden"));
    e.neighborhood().css("visibility", "visible");
    runLayoutThenUpdateCues();
  }

  function hideNei(e) {
    const edges = e.neighborhood("edge:visible");
    if (edges.length < 1) {
      return;
    }
    edges.css("visibility", "hidden");
    const nodes2hide = edges.connectedNodes().not(e);
    nodes2hide.css("visibility", "hidden");
    nodes2hide.connectedEdges().css("visibility", "hidden");
    runLayoutThenUpdateCues();
  }

  function showOrAddCue(e, cueName, onClickFn) {
    const d = e.getCueData();
    const graphElemId = e.id();
    let cue2pos = {
      "collapse-ellipse-dashed": "top",
      "collapse-ellipse": "bottom",
      "collapse-rectangle-dashed": "right",
      "collapse-rectangle": "left",
      "expand-ellipse-dashed": "top-right",
      "expand-ellipse": "top-left",
      "expand-rectangle-dashed": "bottom-right",
      "expand-rectangle": "bottom-left",
    };
    let cue2tooltip = {
      "collapse-ellipse-dashed": "Hide dashed neighbors",
      "collapse-ellipse": "Hide all neighbors",
      "collapse-rectangle-dashed": "Hide dashed neighbors",
      "collapse-rectangle": "Hide all neighbors",
      "expand-ellipse-dashed": "Show dashed neighbors",
      "expand-ellipse": "Show all neighbors",
      "expand-rectangle-dashed": "Show dashed neighbors",
      "expand-rectangle": "Show all neighbors",
    };
    if (d[graphElemId] && d[graphElemId][cueName]) {
      e.updateCue({ id: cueName, show: "select" });
    } else {
      let options4Rect = {
        id: cueName,
        show: "select",
        position: cue2pos[cueName],
        zIndex: 10,
        onCueClicked: onClickFn,
        tooltip: cue2tooltip[cueName],
        imgData: {
          width: IMG_SIZE,
          height: IMG_SIZE,
          src: `assets/${cueName}.svg`,
        },
      };
      e.addCue(options4Rect);
    }
  }

  function hideCueIfExists(e, cueName) {
    const d = e.getCueData();
    const graphElemId = e.id();
    if (d[graphElemId] && d[graphElemId][cueName]) {
      e.updateCue({ id: cueName, show: "never" });
    }
  }

  function updateCues() {
    const nodes = cy.nodes(".rect:visible, .circle:visible");
    for (let i = 0; i < nodes.length; i++) {
      const e = nodes[i];
      const id = e.id();
      if (e.hasClass("rect")) {
        const hiddenDashedEdges = e.neighborhood("edge.dashed:hidden");
        if (hiddenDashedEdges.length > 0) {
          // show or add expand-rect-dashed
          showOrAddCue(e, "expand-rectangle-dashed", showDashedNei);
        } else {
          // hide expand-rect-dashed if exists
          hideCueIfExists(e, "expand-rectangle-dashed");
        }
        const visibleDashedEdges = e.neighborhood("edge.dashed:visible");
        if (visibleDashedEdges.length > 0) {
          // show or add collapse-rect-dashed
          showOrAddCue(e, "collapse-rectangle-dashed", hideDashedNei);
        } else {
          // hide collapse-rect-dashed if exists
          hideCueIfExists(e, "collapse-rectangle-dashed");
        }
        const hiddenEdges = e.neighborhood("edge:hidden");
        if (hiddenEdges.length > 0) {
          // show or add expand-rect
          showOrAddCue(e, "expand-rectangle", showNei);
        } else {
          // hide expand-rect if exists
          hideCueIfExists(e, "expand-rectangle");
        }
        const visibleEdges = e.neighborhood("edge:visible");
        if (visibleEdges.length > 0) {
          // show or add collapse-rect
          showOrAddCue(e, "collapse-rectangle", hideNei);
        } else {
          // hide collapse-rect if exists
          hideCueIfExists(e, "collapse-rectangle");
        }
      } else {
        const hiddenDashedEdges = e.neighborhood("edge.dashed:hidden");
        if (hiddenDashedEdges.length > 0) {
          // show or add expand-circle-dashed
          showOrAddCue(e, "expand-ellipse-dashed", showDashedNei);
        } else {
          // hide expand-circle-dashed if exists
          hideCueIfExists(e, "expand-ellipse-dashed");
        }
        const visibleDashedEdges = e.neighborhood("edge.dashed:visible");
        if (visibleDashedEdges.length > 0) {
          // show or add collapse-circle-dashed
          showOrAddCue(e, "collapse-ellipse-dashed", hideDashedNei);
        } else {
          // hide collapse-circle-dashed if exists
          hideCueIfExists(e, "collapse-ellipse-dashed");
        }

        const hiddenEdges = e.neighborhood("edge:hidden");
        if (hiddenEdges.length > 0) {
          // show or add expand-circle
          showOrAddCue(e, "expand-ellipse", showNei);
        } else {
          // hide expand-circle if exists
          hideCueIfExists(e, "expand-ellipse");
        }
        const visibleEdges = e.neighborhood("edge:visible");
        if (visibleEdges.length > 0) {
          // show or add collapse-circle
          showOrAddCue(e, "collapse-ellipse", hideNei);
        } else {
          // hide collapse-circle if exists
          hideCueIfExists(e, "collapse-ellipse");
        }
      }
    }

    const parents = cy.nodes(":parent:visible");
    const cueId = "compoundCue";
    for (let i = 0; i < parents.length; i++) {
      const e = parents[i];
      const d = e.getCueData();
      const eId = e.id();
      if (d[eId] && d[eId][cueId]) {
        e.removeCue();
      }
      const div = document.createElement("div");
      div.innerHTML = `<span class="badge rounded-pill bg-primary">${
        e.children(":visible").length + " / " + e.children().length
      }</span>`;
      e.addCue({
        id: cueId,
        show: "select",
        position: "top-right",
        htmlElem: div,
      });
    }
  }
}
