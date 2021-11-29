import { debounce, debounce2 } from "./helper";

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

interface CueOptions {
  id: number | string;
  show: "tap" | "hover" | "always";
  position: NodePosition | EdgePosition;
  marginX: string | number;
  marginY: string | number;
  onCueClicked: (ele: any) => void;
  htmlElem: HTMLElement;
  imgData: { width: number; height: number; src: string } | null;
  zoom2hide: number;
  isFixedSize: boolean;
  zIndex: number;
}

interface Cues {
  [key: string]: CueOptions;
}

interface Str2CueData {
  [key: string]: {
    cues: Cues;
    graphElem: any;
    positionFn: Function;
    styleFn: Function;
  };
}

const UPDATE_POPPER_WAIT = 100;
let cueData: Str2CueData = {};

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

function setCueCoords(e, cues: Cues, cyZoom: number, zoom2hide: number) {
  // let the nodes resize first
  let ratio = 1;
  let z1 = (cyZoom / 2) * ratio;
  const bb = e.renderedBoundingBox({
    includeLabels: false,
    includeOverlays: false,
  });

  for (let id in cues) {
    const cue = cues[id];
    const html = cue.htmlElem;
    const w = html.clientWidth;
    const h = html.clientHeight;
    const deltaW4Scale = ((1 - z1) * w) / 2;
    const deltaH4Scale = ((1 - z1) * h) / 2;
    html.style.transform = `translate(${bb.x2 - deltaW4Scale - w * z1}px, ${
      bb.y1 - deltaH4Scale
    }px) scale(${z1})`;
  }

  setCueVisibilities(e.visible(), cues, cyZoom, zoom2hide);
}

function setCueVisibilities(
  isShow: boolean,
  cues: Cues,
  cyZoom: number,
  zoom2hide: number
) {
  if (cyZoom <= zoom2hide) {
    isShow = false;
  }
  let css = "0";
  if (isShow) {
    css = "1";
  }
  for (let id in cues) {
    cues[id].htmlElem.style.opacity = css;
  }
}

function setCueCoordsOfChildren(e, zoom: number, zoom2hide: number) {
  const elems = e.children();
  for (let i = 0; i < elems.length; i++) {
    const child = elems[i];
    if (child.isParent()) {
      setCueCoordsOfChildren(child, zoom, zoom2hide);
    } else {
      const d = cueData[child.id()];
      if (d) {
        setCueCoords(d.graphElem, d.cues, zoom, zoom2hide);
      }
    }
  }
}

function setCueVisibility(e, cues: Cues) {
  if (!e.visible()) {
    for (let id in cues) {
      cues[id].htmlElem.style.opacity = "0";
    }
  } else {
    for (let id in cues) {
      cues[id].htmlElem.style.opacity = "1";
    }
  }
}

function showHideCues(
  eles,
  cueId: string | number | undefined,
  isShow: boolean
) {
  let opacity = "0";
  if (isShow) {
    opacity = "1";
  }
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    if (cueId !== undefined && cueId != null) {
      const cue = cueData[e.id()].cues[cueId];
      if (cue) {
        cue.htmlElem.style.opacity = opacity;
      } else {
        console.error("Can not found a cue with id: ", cueId);
      }
    } else {
      const cues = cueData[e.id()].cues;
      for (let id in cues) {
        cues[id].htmlElem.style.opacity = opacity;
      }
    }
  }
}

function destroyCuesOfGraphElem(e: { target: any }) {
  const id = e.target.id();
  // remove cues from DOM
  const cues = cueData[id].cues;
  for (let cueId in cues) {
    cues[cueId].htmlElem.remove();
  }
  // unbind previously bound functions
  if (cueData[id].positionFn) {
    cueData[id].graphElem.off("position", cueData[id].positionFn);
    cueData[id].graphElem.off("style", cueData[id].styleFn);
    e.target.cy().off("pan zoom resize", cueData[id].positionFn);
  }
  delete cueData[id];
}

export function addCue(cueOptions: CueOptions) {
  const eles = this;
  const cy = this.cy();
  const container = cy.container();
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
      htmlElem = opts.htmlElem.cloneNode(true);
      container.appendChild(htmlElem);
      opts.htmlElem = htmlElem;
    }
    htmlElem.style.position = "absolute";
    htmlElem.style.top = "0px";
    htmlElem.style.left = "0px";

    const id = e.id() + "";
    const positionHandlerFn = debounce2(
      () => {
        const zoom = cy.zoom();
        setCueCoords(e, cueData[id].cues, zoom, opts.zoom2hide);
        setCueCoordsOfChildren(e, zoom, opts.zoom2hide);
      },
      UPDATE_POPPER_WAIT,
      () => {
        setCueVisibilities(false, cueData[id].cues, cy.zoom(), opts.zoom2hide);
      }
    ).bind(this);

    const styleHandlerFn = debounce(() => {
      setCueVisibility(e, cueData[id].cues);
    }, UPDATE_POPPER_WAIT * 2).bind(this);

    e.on("position", positionHandlerFn);
    e.on("style", styleHandlerFn);
    e.on("remove", destroyCuesOfGraphElem);
    cy.on("pan zoom resize", positionHandlerFn);

    const existingCuesData = cueData[id];
    if (existingCuesData) {
    } else {
      let cueId = opts.id;
      if (cueId == null || cueId == undefined || cueId == "") {
        cueId = 0;
      }
      let cues: Cues = {};
      cues[cueId] = opts;
      cueData[id] = {
        cues: cues,
        graphElem: e,
        positionFn: positionHandlerFn,
        styleFn: styleHandlerFn,
      };
    }
    positionHandlerFn();
  }
}

export function removeCue(cueId: string | number) {
  const eles = this;
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    if (cueId !== undefined && cueId != null) {
      const cue = cueData[e.id()].cues[cueId];
      if (cue) {
        cue.htmlElem.remove();
        delete cueData[e.id()].cues[cueId];
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
    const cue = cueData[e.id()].cues[cueId];
    if (cue) {
      cueData[e.id()].cues[cueId] = cueOptions;
    } else {
      console.error("Can not found a cue with id: ", cueId);
    }
  }
}

export function showCue(cueId: string | number | undefined) {
  const eles = this;
  showHideCues(eles, cueId, true);
}

export function hideCue(cueId: string | number | undefined) {
  const eles = this;
  showHideCues(eles, cueId, false);
}
