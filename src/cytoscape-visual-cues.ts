import html2canvas from "html2canvas";
import {
  CueData,
  CueOptions,
  Cues,
  debounce2,
  EdgeCuePosition,
  isNullish,
  NodeCuePosition,
  Point,
  Str2CuesData,
  pointOnRect,
  isNumber,
  quadraticBezierCurve,
  midPoint,
  Str2Cues,
  CyEvent,
} from "./helper";

const UPDATE_POPPER_WAIT = 100;
const STYLE_EVENTS = "style mouseover mouseout select unselect";
let allCues: Str2CuesData = {};
let instanceId = 1;

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
    o.marginY = 0;
  }
  if (isNullish(o.zoom2hide)) {
    o.zoom2hide = 0;
  }
  if (isNullish(o.tooltip)) {
    o.tooltip = "";
  }
  if (isNullish(o.cursor)) {
    o.cursor = "initial";
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
    cursor: o.cursor,
  };
  setMarginIfNeeded(o2);
  if (o.imgData) {
    o2.imgData = {
      src: o.imgData.src,
      width: o.imgData.width,
      height: o.imgData.height,
    };
  }
  return o2;
}

function setMarginIfNeeded(c: CueOptions) {
  if (isNumber(c.marginX)) {
    c.marginX = Number(c.marginX);
  }
  if (isNumber(c.marginY)) {
    c.marginY = Number(c.marginY);
  }
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

function setCueCoords(cueData: CueData, cyZoom: number, cueId?) {
  // let the nodes resize first
  let ratio = 1;
  let z1 = (cyZoom / 2) * ratio;
  const bb = cueData.graphElem.renderedBoundingBox({
    includeLabels: false,
    includeOverlays: false,
  });
  const isEdge = cueData.graphElem.isEdge();

  for (let id in cueData.cues) {
    if (cueId) {
      id = cueId;
    }
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
    if (cueId) {
      return;
    }
  }
}

function switchCueVisibility(cues: Cues, prevOpacities: any, isHide: boolean) {
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
      const d = allCues[instanceId][child.id()];
      if (d) {
        setCueCoords(d, zoom);
      }
    }
  }
}

function hideAllHoverCues() {
  for (let id in allCues[instanceId]) {
    for (let cueId in allCues[instanceId][id].cues) {
      if (allCues[instanceId][id].cues[cueId].show == "hover") {
        allCues[instanceId][id].cues[cueId].htmlElem.style.visibility =
          "hidden";
      }
    }
  }
}

function setCueVisibility(event: CyEvent, cueId?) {
  const e = event.target;
  const targetId = e.id();
  if (!allCues[instanceId] || !allCues[instanceId][targetId]) {
    return;
  }
  const cues: Cues = allCues[instanceId][targetId].cues;
  const eventType = event.type;
  const isElemSelected = e.selected();
  if (!e.visible()) {
    for (let id in cues) {
      cues[id].htmlElem.style.visibility = "hidden";
    }
  } else {
    const zoom = e.cy().zoom();
    if (eventType == "mouseover") {
      hideAllHoverCues();
    }
    for (let id in cues) {
      if (cueId) {
        id = cueId;
      }
      const showType = cues[id].show;
      if (zoom <= cues[id].zoom2hide || showType == "never") {
        cues[id].htmlElem.style.visibility = "hidden";
      } else if (showType == "always") {
        cues[id].htmlElem.style.visibility = "visible";
      } else if (showType == "hover" && eventType == "mouseover") {
        cues[id].htmlElem.style.visibility = "visible";
      } else if (showType == "over") {
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
      if (cueId) {
        return;
      }
    }
  }
}

function destroyCuesOfGraphElem(e: { target: any }) {
  const id = e.target.id();
  // remove cues from DOM
  if (!allCues[instanceId][id]) {
    return;
  }
  const cues = allCues[instanceId][id].cues;
  for (let cueId in cues) {
    cues[cueId].htmlElem.remove();
  }
  // unbind previously bound functions
  if (allCues[instanceId][id].positionFn) {
    if (allCues[instanceId][id].graphElem.isEdge()) {
      allCues[instanceId][id].graphElem
        .source()
        .off("position", allCues[instanceId][id].positionFn);
      allCues[instanceId][id].graphElem
        .target()
        .off("position", allCues[instanceId][id].positionFn);
    } else {
      allCues[instanceId][id].graphElem.off(
        "position",
        allCues[instanceId][id].positionFn
      );
    }
    allCues[instanceId][id].graphElem.off(
      STYLE_EVENTS,
      allCues[instanceId][id].styleFn
    );
    e.target.cy().off("pan zoom resize", allCues[instanceId][id].positionFn);
  }
  delete allCues[instanceId][id];
}

function onElemMove(e, cueOpacities, isSwapOpacity: boolean) {
  const zoom = e.cy().zoom();
  const id = e.id();
  setCueCoords(allCues[instanceId][id], zoom);
  setCueCoordsOfChildren(e, zoom);
  if (isSwapOpacity) {
    switchCueVisibility(allCues[instanceId][id].cues, cueOpacities, false);
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
  htmlElem.style.cursor = opts.cursor;
  if (opts.show != "always") {
    htmlElem.style.visibility = "hidden";
  }
  htmlElem.addEventListener("click", () => {
    if (opts.onCueClicked) {
      opts.onCueClicked(e, opts.id);
    }
  });

  htmlElem.addEventListener("mousedown", stopEvent);
  htmlElem.addEventListener("mouseup", stopEvent);
  htmlElem.addEventListener("touchstart", stopEvent);
  htmlElem.addEventListener("touchend", stopEvent);
}

function updateCueOptions(opts: CueOptions, o2: CueOptions) {
  for (let k in o2) {
    if (k == "htmlElem" || k == "imgData") {
      throw `'htmlElem' and 'imgData' cannot be updated! Please try removing whole cue and then adding it again`;
    }
    opts[k] = o2[k];
    if (k == "tooltip") {
      opts.htmlElem.title = o2[k];
    }
    if (k == "zIndex") {
      opts.htmlElem.style.zIndex = o2[k] + "";
    }
    if (k == "cursor") {
      opts.htmlElem.style.cursor = o2[k] + "";
    }
  }
}

function isCueIdExists(e, opts: CueOptions) {
  if (!isNullish(opts.id) && opts.id != "") {
    const id = e.id();
    if (allCues[instanceId][id] && allCues[instanceId][id].cues[opts.id]) {
      return true;
    }
  }
  return false;
}

function showHideCues(eles, cueId: string | number, isShow: boolean) {
  let vis = "hidden";
  if (isShow) {
    vis = "visible";
  }
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    const eId = e.id();
    if (!allCues[instanceId][eId]) {
      continue;
    }
    if (cueId !== undefined && cueId != null) {
      const cue = allCues[instanceId][eId].cues[cueId];
      if (cue) {
        cue.htmlElem.style.visibility = vis;
      } else {
        console.error("Can not found a cue with id: ", cueId);
      }
    } else {
      const cues = allCues[instanceId][eId].cues;
      for (let id in cues) {
        cues[id].htmlElem.style.visibility = vis;
      }
    }
  }
}

function createInstaceIfNeeded() {
  if (!allCues[instanceId]) {
    allCues[instanceId] = {};
  }
}

/** creates new cue(s) to the calling element(s).
 * Returns an array of booleans. If a cue is added successfully to an element it returns true, otherwise false.
 * @param  {CueOptions} cueOptions
 * @returns boolean
 */
export function addCue(cueOptions: CueOptions): boolean[] {
  createInstaceIfNeeded();
  const eles = this;
  const cy = this.cy();
  const container = cy.container();
  fillEmptyOptions(cueOptions);
  const results: boolean[] = [];
  for (let i = 0; i < eles.length; i++) {
    const opts = deepCopyOptions(cueOptions);
    const e = eles[i];
    const id = e.id() + "";

    checkCuePosition(e, opts.position);
    if (isCueIdExists(e, opts)) {
      console.error(`A cue with id '${opts.id}' already exists for '${id}'`);
      results.push(false);
      break;
    }
    results.push(true);
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

    let cueOpacities = {};
    let isOnMove = false;
    const positionHandlerFn = debounce2(
      () => {
        isOnMove = false;
        // element might be removed before addCue is finished
        if (allCues[instanceId] && allCues[instanceId][id]) {
          onElemMove(e, cueOpacities, true);
          setCueVisibility({ target: e, type: "position" });
        }
      },
      UPDATE_POPPER_WAIT,
      () => {
        isOnMove = true;
        // element might be removed before addCue is finished
        if (allCues[instanceId] && allCues[instanceId][id]) {
          switchCueVisibility(allCues[instanceId][id].cues, cueOpacities, true);
        }
      }
    );

    const styleHandlerFn = (event, cueId = undefined) => {
      if (!isOnMove) {
        setCueVisibility(event, cueId);
      }
    };

    const existingCuesData = allCues[instanceId][id];
    if (existingCuesData) {
      let cueId = opts.id;
      if (isNullish(cueId) || cueId == "") {
        cueId = 0;
        while (existingCuesData.cues[cueId]) {
          cueId++;
        }
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

      allCues[instanceId][id] = {
        cues: cues,
        graphElem: e,
        positionFn: positionHandlerFn,
        styleFn: styleHandlerFn,
      };
    }
    onElemMove(e, cueOpacities, false);
  }
  return results;
}

/** Deletes cue(s) from the calling element(s).
 *  If `cueId` is `null` or `undefined`, deletes all the cue(s).
 * @param  {string|number} cueId
 */
export function removeCue(cueId: string | number) {
  createInstaceIfNeeded();
  const eles = this;
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    const eId = e.id();
    if (!allCues[instanceId][eId]) {
      break;
    }
    if (!isNullish(cueId)) {
      const cue = allCues[instanceId][eId].cues[cueId];
      if (cue) {
        cue.htmlElem.remove();
        delete allCues[instanceId][eId].cues[cueId];
        if (Object.keys(allCues[instanceId][eId].cues).length < 1) {
          destroyCuesOfGraphElem({ target: e });
        }
      } else {
        console.warn(`Can not found a cue with id '${cueId}'`);
      }
    } else {
      destroyCuesOfGraphElem({ target: e });
    }
  }
}

/** Updates given properties of cue(s).
 *  If a cue with the id not found, updates all cues of the element.
 * @param  {CueOptions} cueOptions
 */
export function updateCue(cueOptions: CueOptions) {
  createInstaceIfNeeded();
  const eles = this;
  const cy = this.cy();
  const cueId = cueOptions.id;
  setMarginIfNeeded(cueOptions);
  for (let i = 0; i < eles.length; i++) {
    const opts = cueOptions;
    const e = eles[i];
    const id = e.id();
    if (!allCues[instanceId][id]) {
      continue;
    }
    const cue = allCues[instanceId][id].cues[cueId];
    checkCuePosition(e, opts.position);

    if (cue) {
      updateCueOptions(allCues[instanceId][id].cues[cueId], cueOptions);
    } else {
      const cues = allCues[instanceId][id].cues;
      for (let k in cues) {
        updateCueOptions(allCues[instanceId][id].cues[k], cueOptions);
      }
    }
    setCueCoords(allCues[instanceId][id], cy.zoom(), cueId);
    setCueVisibility({ target: e, type: "style" }, cueId);
  }
}

/** Gets cue data of cue(s).
 *  @returns Str2Cues
 */
export function getCueData(): Str2Cues {
  createInstaceIfNeeded();
  const eles = this;
  let r: Str2Cues = {};
  for (let i = 0; i < eles.length; i++) {
    const id = eles[i].id();
    if (allCues[instanceId] && allCues[instanceId][id]) {
      r[id] = allCues[instanceId][id].cues;
    }
  }

  return r;
}

/** Manually hides cue(s).
 *  If a cue with the id `cueId` is not found, hides all the cues of the element.
 * @param  {string|number} cueId
 */
export function hideCue(cueId: string | number) {
  createInstaceIfNeeded();
  const eles = this;
  showHideCues(eles, cueId, false);
}

/** Manually shows cue(s).
 * @param  {string|number} cueId
 */
export function showCue(cueId: string | number) {
  createInstaceIfNeeded();
  const eles = this;
  showHideCues(eles, cueId, true);
}

/** If a cue with the id `cueId` is not found, shows all the cues of the element.
 *  Sets the active cue instance id.
 * @param  {number} id
 */
export function setActiveInstance(id: number) {
  instanceId = id;
}

/** Gets the active cue instace id.
 */
export function getActiveInstanceId() {
  return instanceId;
}


async function htmlToDataUrl(htmlElement: HTMLElement): Promise<string> {
  // Create a Blob from the HTML content
  const blob = new Blob([htmlElement.outerHTML], { type: 'image/png' });

  // Convert Blob to data URL
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return dataUrl;
}
function getComputedStyleAsObject(el: HTMLElement): { [key: string]: string } {
  const computedStyles = window.getComputedStyle(el);
  const styles: { [key: string]: string } = {};

  for (let i = 0; i < computedStyles.length; i++) {
    const key = computedStyles[i];
    styles[key] = computedStyles.getPropertyValue(key);
  }

  return styles;
}


async function loadImageAsync(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (error) => reject(error);
    img.src = src;
  });
}

/**
 * Gets a PNG of the graph including the cues.
 * @param {any} options - png options.
 * @param {string[]} ignoreElementClasses - Array of classes to ignore.
 * @returns combinedBase64 - Base64-encoded PNG of the graph.
 */
export async function pngFull(options: any, ignoreElementClasses: string[] = []) {
  try {
    // Create a canvas and load and draw the PNG image of the graph using the png() function from cytoscape.js core.
    const cy = this;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const base64png: string = cy.png(options);
    const image = await loadImage(base64png);
    const elements = cy.elements();
    // Calculate the positions of cues on the container, determine the required positions on the canvas, and then add the cues.
    const graphBoundingBox = cy.elements().renderedBoundingBox(); //For option full calculate from graphBoundingBox
    const container = document.getElementById('cy'); //For option !full  calculate from container
    if (!container) {
      throw new Error('Container element not found.');
    }
    let z1 = (cy.zoom() / 2);
    let overflow = 0;
    let cuePositions: { cueX: number; cueY: number }[] = [];
    for (const element of elements) {
      const cues = element.getCueData();
      for (const cueDic of Object.values(cues) as any[]) {
        for (const key in cueDic) {
          if (cueDic.hasOwnProperty(key)) {
            const cue = cueDic[key];
            if (cue.htmlElem) {
              const bb = element.renderedBoundingBox({
                includeLabels: false,
                includeOverlays: false,
              });
              // Calculate cue position within the bounding box with the zoom information
              const isEdge = element.isEdge();
              const w = cue.htmlElem.offsetWidth * z1;
              const h = cue.htmlElem.offsetHeight * z1;
              const pos = cue.position;
              let cueX = (bb.x2 + bb.x1) / 2 - w / 2;
              let cueY = (bb.y1 + bb.y2) / 2 - h / 2;
              if (pos.startsWith('bottom')) {
                cueY = bb.y2 - h / 2;
              } else if (pos.startsWith('top')) {
                cueY = bb.y1 - h / 2;
              }
              if (pos.endsWith('right')) {
                cueX = bb.x2 - w / 2;
              } else if (pos.endsWith('left')) {
                cueX = bb.x1 - w / 2;
              }
              if (isEdge) {
                const p = getCuePositionOnEdge(element, pos as EdgeCuePosition);
                if (p) {
                  cueX = p.x - w / 2;
                  cueY = p.y - h / 2;
                }
              }
              const margins = getMargins(cue, element);
              cueX += (margins.x * z1);
              cueY += (margins.y * z1);
              cuePositions.push({
                cueX: cueX,
                cueY: cueY,
              });
              if (pos.startsWith('bottom')) {
                overflow = Math.max(overflow, Math.abs(bb.y2 - cueY))
              } else if (pos.startsWith('top')) {
                overflow = Math.max(overflow, Math.abs(cueY - bb.y1))
              }
              if (pos.endsWith('right')) {
                overflow = Math.max(overflow, Math.abs(cueX - bb.x2))
              } else if (pos.endsWith('left')) {
                overflow = Math.max(overflow, Math.abs(cueX - bb.x1))
              }
            }
          }
        }
      }
    }

    if (options.full) {
      overflow = overflow * Math.max(image.width / graphBoundingBox.w, image.height / graphBoundingBox.h)
    } else {
      overflow = 0; //Margin for the cues at the edges visibility is 0 if full is false
    }
    canvas.width = image.width + 2 * overflow;
    canvas.height = image.height + 2 * overflow;
    if (!ctx) {
      throw new Error('Unable to obtain 2D context for canvas.');
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, overflow, overflow, image.width, image.height);
    let index = 0;
    for (const element of elements) {
      const cues = element.getCueData();
      for (const cueDic of Object.values(cues) as any[]) {
        for (const key in cueDic) {
          if (cueDic.hasOwnProperty(key)) {
            const cue = cueDic[key];
            if (cue.htmlElem) {
              //Add cues to the image canvas in a manner analogous to adding them to the cytoscape canvas.
              try {
                //Use html2canvas package let you convert cue html element to canvas image
                const elementHTML = cue.htmlElem as HTMLElement;
                const dataUrl = await html2canvas(elementHTML, {
                  scale: options.scale * (options.full ? 1/z1 : 1),
                  ignoreElements: (element) => ignoreElementClasses.some((className) => element.classList.contains(className)),
                  backgroundColor: 'transparent',
                });
                const cueImg = await loadImage(dataUrl.toDataURL());
                const cueX = cuePositions[index].cueX;
                const cueY = cuePositions[index].cueY;
                let cueXSource;
                let cueYSource;
                if (options.full) {
                  cueXSource = ((cueX - ((graphBoundingBox.x1 + graphBoundingBox.x2) / 2)) * image.width) / graphBoundingBox.w;
                  cueYSource = ((cueY - ((graphBoundingBox.y1 + graphBoundingBox.y2) / 2)) * image.height) / graphBoundingBox.h;
                  ctx.drawImage(cueImg, cueXSource + image.width / 2 + overflow, cueYSource + image.height / 2 + overflow, (z1 / options.scale) * cueImg.width * image.width / graphBoundingBox.w, (z1 / options.scale) * cueImg.height * image.height / graphBoundingBox.h);
                } else {
                  cueXSource = (cueX * image.width) / container.offsetWidth;
                  cueYSource = (cueY * image.height) / container.offsetHeight;
                  console.log()
                  ctx.drawImage(cueImg, cueXSource, cueYSource, (1 / options.scale) * cueImg.width * image.width / container.offsetWidth, (1 / options.scale) * cueImg.height * image.height / container.offsetHeight);
                }
                index += 1;

              } catch (error) {
                console.error('Error processing image:', error);
              }
            }
          }
        }
      }
    }
    const combinedBase64 = canvas.toDataURL();
    return combinedBase64;

  } catch (error) {
    throw error;
  }
}



function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img2 = new Image();
    img2.src = src;
    img2.onload = () => resolve(img2);
    img2.onerror = (error) => {
      console.error('Error loading image:', error);
      reject('Error loading image');
    };

  });
}
