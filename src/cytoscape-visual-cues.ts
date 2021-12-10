import {
  CueData,
  CueOptions,
  Cues,
  debounce2,
  EdgeCuePosition,
  Events2show,
  isNullish,
  NodeCuePosition,
  Point,
  Str2CueData,
  pointOnRect,
  isNumber,
  quadraticBezierCurve,
  midPoint,
} from "./helper";

const UPDATE_POPPER_WAIT = 100;
const STYLE_EVENTS = "style mouseover mouseout select unselect";
let allCues: Str2CueData = {};

function fillEmptyOptions(o: CueOptions) {
  if (!o.show) {
    o.show = "always";
  }
  if (isNullish(o.isFixedSize)) {
    o.isFixedSize = false;
  }
  if (isNullish(o.marginX)) {
    o.marginX = 0;
  }
  if (isNullish(o.marginY)) {
    o.marginX = 0;
  }
  if (isNullish(o.zoom2hide)) {
    o.zoom2hide = 0;
  }
}

/** create a deep copy of options since the same HTML element might used to make multiple calls
 * @param  {CueOptions} o
 * @returns CueOptions
 */
function deepCopyOptions(o: CueOptions): CueOptions {
  let o2: CueOptions = {
    id: o.id,
    show: o.show,
    position: o.position,
    marginX: o.marginX,
    marginY: o.marginY,
    onCueClicked: o.onCueClicked,
    htmlElem: o.htmlElem
      ? (o.htmlElem.cloneNode(true) as HTMLElement)
      : o.htmlElem,
    imgData: null,
    zoom2hide: o.zoom2hide,
    isFixedSize: o.isFixedSize,
    zIndex: o.zIndex,
    tooltip: o.tooltip,
  };
  if (isNumber(o2.marginX)) {
    o2.marginX = Number(o2.marginX);
  }
  if (isNumber(o2.marginY)) {
    o2.marginY = Number(o2.marginY);
  }
  if (o.imgData) {
    o2.imgData = {
      src: o.imgData.src,
      width: o.imgData.width,
      height: o.imgData.height,
    };
  }
  return o2;
}

function getCuePositionOnEdge(edge, cuePos: EdgeCuePosition): Point | void {
  const segmentPoints = edge.segmentPoints();
  if (segmentPoints) {
    return getPosition4SegmentedEdge(edge, cuePos);
  }
  const controlPoints = edge.controlPoints();
  if (controlPoints) {
    return getPosition4CurvedEdge(edge, cuePos);
  }
  if (cuePos == "center") {
    return;
  }
  let b: any = {};
  if (cuePos == "source") {
    b = edge.source().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
  } else {
    b = edge.target().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
  }
  let otherEnd = { x: 0, y: 0 };
  if (cuePos == "source") {
    otherEnd = edge.renderedTargetEndpoint();
  } else {
    otherEnd = edge.renderedSourceEndpoint();
  }
  return pointOnRect(otherEnd, b);
}

function getPosition4SegmentedEdge(edge: any, pos: EdgeCuePosition): Point {
  const segments = edge.renderedSegmentPoints();
  if (pos == "target") {
    const b = edge.target().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
    const p = segments[segments.length - 1];
    return pointOnRect(p, b);
  }
  if (pos == "source") {
    const b = edge.source().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
    const p = segments[0];
    return pointOnRect(p, b);
  }

  const i1 = Math.floor(segments.length / 2);
  if (segments.length % 2 == 0) {
    const p1 = segments[i1];
    const p2 = segments[i1 - 1];
    return midPoint(p1, p2);
  }
  return segments[i1];
}

function getPosition4CurvedEdge(edge, pos: EdgeCuePosition): Point {
  const ctrlPoints = edge.renderedControlPoints();
  if (pos == "target") {
    const b = edge.target().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
    const p = ctrlPoints[ctrlPoints.length - 1];
    return pointOnRect(p, b);
  }
  if (pos == "source") {
    const b = edge.source().renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
    const p = ctrlPoints[0];
    return pointOnRect(p, b);
  }
  const i1 = Math.floor(ctrlPoints.length / 2);
  if (ctrlPoints.length % 2 == 0) {
    const p1 = ctrlPoints[i1];
    const p2 = ctrlPoints[i1 - 1];
    return midPoint(p1, p2);
  }
  let prev = edge.renderedSourceEndpoint();
  let next = edge.renderedTargetEndpoint();
  if (i1 > 0) {
    prev = ctrlPoints[i1 - 1];
  }
  if (i1 < ctrlPoints.length - 1) {
    next = ctrlPoints[i1 + 1];
  }
  let weight = 0.5;
  if (ctrlPoints.length == 1) {
    weight = Number(edge.css("control-point-weights"));
    return quadraticBezierCurve(prev, ctrlPoints[i1], next, weight);
  }
  return quadraticBezierCurve(
    midPoint(prev, ctrlPoints[i1]),
    ctrlPoints[i1],
    midPoint(ctrlPoints[i1], next),
    weight
  );
}

function getMargins(c: CueOptions, graphElem): Point {
  const r = { x: 0, y: 0 };
  if (graphElem.isNode()) {
    const bb = graphElem.renderedBoundingBox({
      includeLabels: false,
      includeOverlays: false,
    });
    if (typeof c.marginX == "number") {
      r.x = c.marginX;
    } else if (typeof c.marginX == "string") {
      const marginX = (Number(c.marginX.substring(1)) / 100) * bb.w;
      r.x = marginX;
    }
    if (typeof c.marginY == "number") {
      r.y = c.marginY;
    } else if (typeof c.marginY == "string") {
      const marginY = (Number(c.marginY.substring(1)) / 100) * bb.h;
      r.y = marginY;
    }
  } else {
    const tgt = graphElem.renderedTargetEndpoint();
    const src = graphElem.renderedSourceEndpoint();
    const deltaY = tgt.y - src.y;
    const deltaX = tgt.x - src.x;
    const angle = Math.atan(deltaY / deltaX);
    const edgeLength = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    let direction = deltaX > 0 ? 1 : -1;
    if (typeof c.marginX == "number") {
      r.y += c.marginX * sin;
      r.x += c.marginX * cos;
    } else if (typeof c.marginX == "string") {
      const delta = edgeLength * (Number(c.marginX.substring(1)) / 100);
      r.y += delta * sin;
      r.x += delta * cos;
    }
    const wid = graphElem.renderedWidth();
    if (typeof c.marginY == "number") {
      r.x += c.marginY * sin;
      r.y += c.marginY * cos;
    } else if (typeof c.marginY == "string") {
      const delta = wid * (Number(c.marginY.substring(1)) / 100);
      r.x += delta * sin;
      r.y += delta * cos;
    }
    r.x *= direction;
    r.y *= direction;
  }
  return r;
}

function checkCuePosition(graphElem, pos: NodeCuePosition | EdgeCuePosition) {
  const isNode = graphElem.isNode();

  if (isNode && (pos == "target" || pos == "source")) {
    throw `'${pos}' is invalid cue position for a node`;
  }
  if (!isNode && pos != "target" && pos != "source" && pos != "center") {
    throw `'${pos}' is invalid cue position for an edge`;
  }
}

function setCueCoords(cueData: CueData, cyZoom: number) {
  // let the nodes resize first
  let ratio = 1;
  let z1 = (cyZoom / 2) * ratio;
  const bb = cueData.graphElem.renderedBoundingBox({
    includeLabels: false,
    includeOverlays: false,
  });
  const isEdge = cueData.graphElem.isEdge();

  for (let id in cueData.cues) {
    const cue = cueData.cues[id];
    const w = cue.htmlElem.clientWidth;
    const h = cue.htmlElem.clientHeight;
    const pos = cue.position;
    let y = (bb.y1 + bb.y2) / 2 - h / 2;
    let x = (bb.x2 + bb.x1) / 2 - w / 2;
    if (pos == "bottom" || pos == "bottom-left" || pos == "bottom-right") {
      y = bb.y2 - h / 2;
    } else if (pos == "top" || pos == "top-left" || pos == "top-right") {
      y = bb.y1 - h / 2;
    }
    if (pos == "right" || pos == "top-right" || pos == "bottom-right") {
      x = bb.x2 - w / 2;
    } else if (pos == "left" || pos == "top-left" || pos == "bottom-left") {
      x = bb.x1 - w / 2;
    }
    if (isEdge) {
      const p = getCuePositionOnEdge(cueData.graphElem, pos as EdgeCuePosition);
      if (p) {
        x = p.x - w / 2;
        y = p.y - h / 2;
      }
    }
    const margins = getMargins(cue, cueData.graphElem);
    x += margins.x;
    y += margins.y;
    let scale = `scale(${z1})`;
    if (cue.isFixedSize) {
      scale = "";
    }
    cue.htmlElem.style.transform = `translate(${x}px, ${y}px) ${scale}`;
  }
}

function switchCueOpacities(cues: Cues, prevOpacities: any, isHide: boolean) {
  for (let id in cues) {
    if (isHide) {
      prevOpacities[id] = cues[id].htmlElem.style.visibility;
      cues[id].htmlElem.style.visibility = "hidden";
    } else {
      cues[id].htmlElem.style.visibility = prevOpacities[id];
    }
  }
}

function setCueCoordsOfChildren(e, zoom: number) {
  const elems = e.children();
  for (let i = 0; i < elems.length; i++) {
    const child = elems[i];
    if (child.isParent()) {
      setCueCoordsOfChildren(child, zoom);
    } else {
      const d = allCues[child.id()];
      if (d) {
        setCueCoords(d, zoom);
      }
    }
  }
}

function setCueVisibility(e, cues: Cues, eventType: Events2show) {
  const isElemSelected = e.selected();
  if (!e.visible()) {
    for (let id in cues) {
      cues[id].htmlElem.style.visibility = "hidden";
    }
  } else {
    const zoom = e.cy().zoom();
    for (let id in cues) {
      const showType = cues[id].show;
      if (zoom <= cues[id].zoom2hide || showType == "never") {
        cues[id].htmlElem.style.visibility = "hidden";
      } else if (showType == "always") {
        cues[id].htmlElem.style.visibility = "visible";
      } else if (showType == "hover") {
        if (eventType == "mouseout") {
          cues[id].htmlElem.style.visibility = "hidden";
        } else if (eventType == "mouseover") {
          cues[id].htmlElem.style.visibility = "visible";
        }
      } else if (showType == "select") {
        if (eventType == "select" || isElemSelected) {
          cues[id].htmlElem.style.visibility = "visible";
        } else if (eventType == "unselect") {
          cues[id].htmlElem.style.visibility = "hidden";
        }
      }
    }
  }
}

function destroyCuesOfGraphElem(e: { target: any }) {
  const id = e.target.id();
  // remove cues from DOM
  if (!allCues[id]) {
    return;
  }
  const cues = allCues[id].cues;
  for (let cueId in cues) {
    cues[cueId].htmlElem.remove();
  }
  // unbind previously bound functions
  if (allCues[id].positionFn) {
    if (allCues[id].graphElem.isEdge()) {
      allCues[id].graphElem.source().off("position", allCues[id].positionFn);
      allCues[id].graphElem.target().off("position", allCues[id].positionFn);
    } else {
      allCues[id].graphElem.off("position", allCues[id].positionFn);
    }
    allCues[id].graphElem.off(STYLE_EVENTS, allCues[id].styleFn);
    e.target.cy().off("pan zoom resize", allCues[id].positionFn);
  }
  delete allCues[id];
}

function onElemMove(e, cueOpacities, isSwapOpacity: boolean) {
  const zoom = e.cy().zoom();
  const id = e.id();
  setCueCoords(allCues[id], zoom);
  setCueCoordsOfChildren(e, zoom);
  if (isSwapOpacity) {
    switchCueOpacities(allCues[id].cues, cueOpacities, false);
  }
}

function addEventListeners4Elem(e, cy, positionHandlerFn, styleHandlerFn) {
  if (e.isEdge()) {
    e.source().on("position", positionHandlerFn);
    e.target().on("position", positionHandlerFn);
  } else {
    e.on("position", positionHandlerFn);
  }
  e.on(STYLE_EVENTS, styleHandlerFn);
  e.on("remove", destroyCuesOfGraphElem);
  cy.on("pan zoom resize", positionHandlerFn);
}

function stopEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function prepareHTMLElement(container, htmlElem, opts: CueOptions, e) {
  container.appendChild(htmlElem);
  htmlElem.style.position = "absolute";
  htmlElem.style.top = "0px";
  htmlElem.style.left = "0px";
  htmlElem.style.zIndex = opts.zIndex;
  htmlElem.title = opts.tooltip;
  if (opts.show != "always") {
    htmlElem.style.visibility = "hidden";
  }
  htmlElem.addEventListener("click", () => {
    if (opts.onCueClicked) {
      opts.onCueClicked(e);
    }
  });

  htmlElem.addEventListener("mousedown", stopEvent);
  htmlElem.addEventListener("mouseup", stopEvent);
  htmlElem.addEventListener("touchstart", stopEvent);
  htmlElem.addEventListener("touchend", stopEvent);
}

function updateCueOptions(opts: CueOptions, o2) {
  for (let k in o2) {
    if (k == "htmlElem" || k == "imgData") {
      throw `'htmlElem' and 'imgData' cannot be updated! Please try removing whole cue and then adding it again`;
    }
    if (k in o2) {
      opts[k] = o2[k];
    }
  }
}

export function addCue(cueOptions: CueOptions) {
  const eles = this;
  const cy = this.cy();
  const container = cy.container();
  fillEmptyOptions(cueOptions);
  for (let i = 0; i < eles.length; i++) {
    const opts = deepCopyOptions(cueOptions);
    const e = eles[i];
    checkCuePosition(e, opts.position);
    let htmlElem;
    if (opts.imgData) {
      htmlElem = document.createElement("img");
      htmlElem.width = opts.imgData?.width;
      htmlElem.height = opts.imgData?.height;
      htmlElem.src = opts.imgData?.src;
      opts.htmlElem = htmlElem;
    } else {
      htmlElem = opts.htmlElem;
    }
    prepareHTMLElement(container, htmlElem, opts, e);

    const id = e.id() + "";
    let cueOpacities = {};
    let isOnMove = false;
    const positionHandlerFn = debounce2(
      () => {
        isOnMove = false;
        onElemMove(e, cueOpacities, true);
        setCueVisibility(e, allCues[id].cues, "position");
      },
      UPDATE_POPPER_WAIT,
      () => {
        isOnMove = true;
        switchCueOpacities(allCues[id].cues, cueOpacities, true);
      }
    );

    const styleHandlerFn = (event) => {
      if (!isOnMove) {
        const target = event.target;
        const targetId = target.id();
        if (allCues[targetId]) {
          setCueVisibility(target, allCues[targetId].cues, event.type);
        }
      }
    };

    const existingCuesData = allCues[id];
    if (existingCuesData) {
      let cueId = opts.id;
      if (isNullish(cueId) || cueId == "") {
        cueId = 0;
        while (existingCuesData.cues[cueId]) {
          cueId++;
        }
      }
      if (existingCuesData.cues[cueId]) {
        console.error(`A cue with id ${cueId} already exists for: ${id}`);
        return;
      }
      existingCuesData.cues[cueId] = opts;
    } else {
      addEventListeners4Elem(e, cy, positionHandlerFn, styleHandlerFn);
      let cueId = opts.id;
      if (isNullish(cueId) || cueId == "") {
        cueId = 0;
      }
      let cues: Cues = {};
      cues[cueId] = opts;
      allCues[id] = {
        cues: cues,
        graphElem: e,
        positionFn: positionHandlerFn,
        styleFn: styleHandlerFn,
      };
    }
    onElemMove(e, cueOpacities, false);
  }
}

export function removeCue(cueId: string | number) {
  const eles = this;
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    if (!isNullish(cueId)) {
      const cue = allCues[e.id()].cues[cueId];
      if (cue) {
        cue.htmlElem.remove();
        delete allCues[e.id()].cues[cueId];
        if (Object.keys(allCues[e.id()].cues).length < 1) {
          destroyCuesOfGraphElem({ target: e });
        }
      } else {
        console.warn("Can not found a cue with id: ", cueId);
      }
    } else {
      destroyCuesOfGraphElem({ target: e });
    }
  }
}

export function updateCue(cueOptions: CueOptions) {
  const eles = this;
  const cueId = cueOptions.id;
  fillEmptyOptions(cueOptions);
  for (let i = 0; i < eles.length; i++) {
    const opts = cueOptions;
    const e = eles[i];
    const id = e.id();
    const cue = allCues[id].cues[cueId];
    checkCuePosition(e, opts.position);

    if (cue) {
      updateCueOptions(allCues[id].cues[cueId], cueOptions);
    } else {
      const cues = allCues[id].cues;
      for (let k in cues) {
        updateCueOptions(allCues[id].cues[k], cueOptions);
      }
    }
    allCues[id].positionFn();
    allCues[id].styleFn({ type: "position" });
  }
}

export function getCueData() {
  const eles = this;
  let r = {};
  for (let i = 0; i < eles.length; i++) {
    const id = eles[i].id();
    if (allCues[id]) {
      r[id] = allCues[id].cues;
    }
  }

  return r;
}
