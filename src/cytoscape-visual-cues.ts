import { debounce2 } from "./helper";

type NodePosition =
  | "top"
  | "center"
  | "bottom"
  | "right"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

type EdgePosition = "target" | "source" | "center";

type Events2show = "mouseover" | "mouseout" | "style" | "select" | "unselect";

type StrNum = string | number | undefined;

interface CueOptions {
  id: number | string;
  show: "select" | "hover" | "always";
  position: NodePosition | EdgePosition;
  marginX: string | number;
  marginY: string | number;
  onCueClicked: ((ele: any) => void) | undefined;
  htmlElem: HTMLElement;
  imgData: { width: number; height: number; src: string } | null;
  zoom2hide: number;
  isFixedSize: boolean;
  zIndex: number;
}

interface Cues {
  [key: string]: CueOptions;
}

interface CueData {
  cues: Cues;
  graphElem: any;
  positionFn: Function;
  styleFn: Function;
}

interface Str2CueData {
  [key: string]: CueData;
}

const UPDATE_POPPER_WAIT = 100;
let allCues: Str2CueData = {};

function fillEmptyOptions(o: CueOptions) {
  if (!o.show) {
    o.show = "always";
  }
  if (o.isFixedSize == undefined || o.isFixedSize == null) {
    o.isFixedSize = false;
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
    htmlElem: o.htmlElem.cloneNode(true) as HTMLElement,
    imgData: null,
    zoom2hide: o.zoom2hide,
    isFixedSize: o.isFixedSize,
    zIndex: o.zIndex,
  };
  if (o.imgData) {
    o2.imgData = {
      src: o.imgData.src,
      width: o.imgData.width,
      height: o.imgData.height,
    };
  }
  return o2;
}

/**
 * Finds the intersection point between the rectangle with parallel sides to the x and y
 * axes the half-line pointing towards (x,y) originating from the middle of the rectangle
 * Note: the function works given min[XY] <= max[XY],
 *       even though minY may not be the "top" of the rectangle
 *       because the coordinate system is flipped.
 * Note: if the input is inside the rectangle,
 *       the line segment wouldn't have an intersection with the rectangle,
 *       but the projected half-line does.
 * Warning: passing in the middle of the rectangle will return the midpoint itself
 *          there are infinitely many half-lines projected in all directions,
 *          so let's just shortcut to midpoint (GIGO).
 *
 * @param x:Number x coordinate of point to build the half-line from
 * @param y:Number y coordinate of point to build the half-line from
 * @param minX:Number the "left" side of the rectangle
 * @param minY:Number the "top" side of the rectangle
 * @param maxX:Number the "right" side of the rectangle
 * @param maxY:Number the "bottom" side of the rectangle
 * @return an object with x and y members for the intersection
 * @throws if validate == true and (x,y) is inside the rectangle
 * @author TWiStErRob
 * @licence Dual CC0/WTFPL/Unlicence, whatever floats your boat
 * @see <a href="http://stackoverflow.com/a/31254199/253468">source</a>
 * @see <a href="http://stackoverflow.com/a/18292964/253468">based on</a>
 */
function pointOnRect(x, y, minX, minY, maxX, maxY) {
  let midX = (minX + maxX) / 2;
  let midY = (minY + maxY) / 2;
  // if (midX - x == 0) -> m == ±Inf -> minYx/maxYx == x (because value / ±Inf = ±0)
  let m = (midY - y) / (midX - x);

  if (x <= midX) {
    // check "left" side
    let minXy = m * (minX - x) + y;
    if (minY <= minXy && minXy <= maxY) return { x: minX, y: minXy };
  }

  if (x >= midX) {
    // check "right" side
    let maxXy = m * (maxX - x) + y;
    if (minY <= maxXy && maxXy <= maxY) return { x: maxX, y: maxXy };
  }

  if (y <= midY) {
    // check "top" side
    let minYx = (minY - y) / m + x;
    if (minX <= minYx && minYx <= maxX) return { x: minYx, y: minY };
  }

  if (y >= midY) {
    // check "bottom" side
    let maxYx = (maxY - y) / m + x;
    if (minX <= maxYx && maxYx <= maxX) return { x: maxYx, y: maxY };
  }

  // edge case when finding midpoint intersection: m = 0/0 = NaN
  if (x === midX && y === midY) return { x: x, y: y };

  // Should never happen :) If it does, please tell me!
  throw (
    "Cannot find intersection for " +
    [x, y] +
    " inside rectangle " +
    [minX, minY] +
    " - " +
    [maxX, maxY] +
    "."
  );
}

function setCueCoords(cueData: CueData, cyZoom: number) {
  // let the nodes resize first
  let ratio = 1;
  let z1 = (cyZoom / 2) * ratio;
  const bb = cueData.graphElem.renderedBoundingBox({
    includeLabels: false,
    includeOverlays: false,
  });
  const isNode = cueData.graphElem.isNode();

  for (let id in cueData.cues) {
    const cue = cueData.cues[id];
    const w = cue.htmlElem.clientWidth;
    const h = cue.htmlElem.clientHeight;
    const pos = cue.position;
    let y = (bb.y1 + bb.y2) / 2 - h / 2;
    let x = (bb.x2 + bb.x1) / 2 - w / 2;
    if (isNode && (pos == "target" || pos == "source")) {
      console.error(`'${pos}' is invalid cue position for a node`);
      return;
    }
    if (!isNode && pos != "target" && pos != "source" && pos != "center") {
      console.error(`'${pos}' is invalid cue position for an edge`);
      return;
    }
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

    if (pos == "source") {
      const b = cueData.graphElem.source().renderedBoundingBox({
        includeLabels: false,
        includeOverlays: false,
      });
      const tgtEnd = cueData.graphElem.renderedTargetEndpoint();
      const l = Math.min(b.x1, b.x2);
      const t = Math.min(b.y1, b.y2);
      const r = Math.max(b.x1, b.x2);
      const bo = Math.max(b.y1, b.y2);
      const p = pointOnRect(tgtEnd.x, tgtEnd.y, l, t, r, bo);
      x = p.x - w / 2;
      y = p.y - h / 2;
    }
    if (pos == "target") {
      const b = cueData.graphElem.target().renderedBoundingBox({
        includeLabels: false,
        includeOverlays: false,
      });
      const srcEnd = cueData.graphElem.renderedSourceEndpoint();
      const l = Math.min(b.x1, b.x2);
      const t = Math.min(b.y1, b.y2);
      const r = Math.max(b.x1, b.x2);
      const bo = Math.max(b.y1, b.y2);
      const p = pointOnRect(srcEnd.x, srcEnd.y, l, t, r, bo);
      x = p.x - w / 2;
      y = p.y - h / 2;
      // x = tgtEnd.x - w / 2;
      // y = tgtEnd.y - h / 2;
    }
    cue.htmlElem.style.transform = `translate(${x}px, ${y}px) scale(${z1})`;
  }
}

function switchCueOpacities(cues: Cues, prevOpacities: any, isHide: boolean) {
  for (let id in cues) {
    if (isHide) {
      prevOpacities[id] = cues[id].htmlElem.style.opacity;
      cues[id].htmlElem.style.opacity = "0";
    } else {
      cues[id].htmlElem.style.opacity = prevOpacities[id];
    }
  }
}

function setCueCoordsOfChildren(e, zoom: number, zoom2hide: number) {
  const elems = e.children();
  for (let i = 0; i < elems.length; i++) {
    const child = elems[i];
    if (child.isParent()) {
      setCueCoordsOfChildren(child, zoom, zoom2hide);
    } else {
      const d = allCues[child.id()];
      if (d) {
        setCueCoords(d, zoom);
      }
    }
  }
}

function setCueVisibility(e, cues: Cues, eventType: Events2show) {
  if (!e.visible()) {
    for (let id in cues) {
      cues[id].htmlElem.style.opacity = "0";
    }
  } else {
    for (let id in cues) {
      const showType = cues[id].show;
      if (showType == "always") {
        cues[id].htmlElem.style.opacity = "1";
      } else if (showType == "hover") {
        if (eventType == "mouseout") {
          cues[id].htmlElem.style.opacity = "0";
        } else if (eventType == "mouseover") {
          cues[id].htmlElem.style.opacity = "1";
        }
      } else if (showType == "select") {
        if (eventType == "select") {
          cues[id].htmlElem.style.opacity = "1";
        } else if (eventType == "unselect") {
          cues[id].htmlElem.style.opacity = "0";
        }
      }
    }
  }
}

function showHideCues(eles, cueId: StrNum, isShow: boolean) {
  let opacity = "0";
  if (isShow) {
    opacity = "1";
  }
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    if (cueId !== undefined && cueId != null) {
      const cue = allCues[e.id()].cues[cueId];
      if (cue) {
        cue.htmlElem.style.opacity = opacity;
      } else {
        console.error("Can not found a cue with id: ", cueId);
      }
    } else {
      const cues = allCues[e.id()].cues;
      for (let id in cues) {
        cues[id].htmlElem.style.opacity = opacity;
      }
    }
  }
}

function destroyCuesOfGraphElem(e: { target: any }) {
  const id = e.target.id();
  // remove cues from DOM
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
    allCues[id].graphElem.off("style", allCues[id].styleFn);
    e.target.cy().off("pan zoom resize", allCues[id].positionFn);
  }
  delete allCues[id];
}

function onElemMove(e, cueOpacities, zoom2hide, isSwapOpacity: boolean) {
  const zoom = e.cy().zoom();
  const id = e.id();
  setCueCoords(allCues[id], zoom);
  setCueCoordsOfChildren(e, zoom, zoom2hide);
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
  e.on("style mouseover mouseout select unselect", styleHandlerFn);
  e.on("remove", destroyCuesOfGraphElem);
  cy.on("pan zoom resize", positionHandlerFn);
}

export function addCue(cueOptions: CueOptions) {
  const eles = this;
  const cy = this.cy();
  const container = cy.container();
  fillEmptyOptions(cueOptions);
  for (let i = 0; i < eles.length; i++) {
    const opts = deepCopyOptions(cueOptions);
    const e = eles[i];
    let htmlElem;
    if (typeof opts.htmlElem == "string") {
      htmlElem = document.createElement("img");
      htmlElem.width = opts.imgData?.width;
      htmlElem.height = opts.imgData?.height;
      opts.htmlElem = htmlElem;
    } else {
      htmlElem = opts.htmlElem;
      container.appendChild(htmlElem);
    }
    htmlElem.style.position = "absolute";
    htmlElem.style.top = "0px";
    htmlElem.style.left = "0px";
    htmlElem.style.zIndex = cueOptions.zIndex;
    if (opts.show != "always") {
      htmlElem.style.opacity = "0";
    }

    htmlElem.addEventListener("click", () => {
      if (cueOptions.onCueClicked) {
        cueOptions.onCueClicked(e);
      }
    });

    const id = e.id() + "";
    let cueOpacities = {};
    const positionHandlerFn = debounce2(
      () => {
        onElemMove(e, cueOpacities, opts.zoom2hide, true);
      },
      UPDATE_POPPER_WAIT,
      () => {
        switchCueOpacities(allCues[id].cues, cueOpacities, true);
      }
    );

    const styleHandlerFn = (event) => {
      setCueVisibility(e, allCues[id].cues, event.type);
    };

    const existingCuesData = allCues[id];
    if (existingCuesData) {
      let cueId = opts.id;
      if (cueId == null || cueId == undefined || cueId == "") {
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
      if (cueId == null || cueId == undefined || cueId == "") {
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
    onElemMove(e, cueOpacities, opts.zoom2hide, false);
  }
}

export function removeCue(cueId: string | number) {
  const eles = this;
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    if (cueId !== undefined && cueId != null) {
      const cue = allCues[e.id()].cues[cueId];
      if (cue) {
        cue.htmlElem.remove();
        delete allCues[e.id()].cues[cueId];
      } else {
        console.error("Can not found a cue with id: ", cueId);
      }
    } else {
      destroyCuesOfGraphElem({ target: e });
    }
  }
}

export function updateCue(cueOptions: CueOptions) {
  const eles = this;
  const cueId = cueOptions.id;
  if (cueId !== undefined && cueId != null) {
    console.error("Id is undefined. To update a 'cueId' must be provided!");
    return;
  }
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    const cue = allCues[e.id()].cues[cueId];
    if (cue) {
      allCues[e.id()].cues[cueId] = cueOptions;
    } else {
      console.error("Can not found a cue with id: ", cueId);
    }
  }
}

export function showCue(cueId: StrNum) {
  const eles = this;
  showHideCues(eles, cueId, true);
}

export function hideCue(cueId: StrNum) {
  const eles = this;
  showHideCues(eles, cueId, false);
}
