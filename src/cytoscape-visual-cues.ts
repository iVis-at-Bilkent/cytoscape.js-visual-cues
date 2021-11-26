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

function setBadgeCoords(e, cues: Cues, cyZoom: number, zoom2hide: number) {
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

  showHideBadge(e.visible(), cues, cyZoom, zoom2hide);
}

function showHideBadge(
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

function setBadgeCoordsOfChildren(e, zoom: number, zoom2hide: number) {
  const elems = e.children();
  for (let i = 0; i < elems.length; i++) {
    const child = elems[i];
    if (child.isParent()) {
      setBadgeCoordsOfChildren(child, zoom, zoom2hide);
    } else {
      const d = cueData[child.id()];
      if (d) {
        setBadgeCoords(d.graphElem, d.cues, zoom, zoom2hide);
      }
    }
  }
}

function setBadgeVisibility(e, div: HTMLElement) {
  if (!e.visible()) {
    div.style.opacity = "0";
  }
}

export function addCue(cueOptions: CueOptions) {
  const eles = this;
  const cy = this.cy();
  const container = cy.container();
  for (let i = 0; i < eles.length; i++) {
    const e = eles[i];
    let htmlElem;
    if (typeof cueOptions.htmlElem == "string") {
      htmlElem = document.createElement("img");
      htmlElem.width = cueOptions.imgData?.width;
      htmlElem.height = cueOptions.imgData?.height;
      cueOptions.htmlElem = htmlElem;
    } else {
      container.appendChild(cueOptions.htmlElem);
      htmlElem = cueOptions.htmlElem;
    }
    htmlElem.style.position = "absolute";
    htmlElem.style.top = "0px";
    htmlElem.style.left = "0px";
    
    const id = e.id() + "";
    const positionHandlerFn = debounce2(
      () => {
        const zoom = cy.zoom();
        setBadgeCoords(e, cueData[id].cues, zoom, cueOptions.zoom2hide);
        setBadgeCoordsOfChildren(e, zoom, cueOptions.zoom2hide);
      },
      UPDATE_POPPER_WAIT,
      () => {
        showHideBadge(
          false,
          cueData[id].cues,
          cy.zoom(),
          cueOptions.zoom2hide
        );
      }
    ).bind(this);

    const styleHandlerFn = debounce(() => {
      setBadgeVisibility(e, htmlElem);
    }, UPDATE_POPPER_WAIT * 2).bind(this);

    e.on("position", positionHandlerFn);
    e.on("style", styleHandlerFn);
    cy.on("pan zoom resize", positionHandlerFn);

    const existingCuesData = cueData[id];
    if (existingCuesData) {
    } else {
      let cueId = cueOptions.id;
      if (cueId === null || cueId === undefined) {
        cueId = 0;
      }
      let cues: Cues = {};
      cues[cueId] = cueOptions;
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
}

export function updateCue(cueOptions: CueOptions) {
  const eles = this;
}

export function showCue(cueId: string | number) {
  const eles = this;
}

export function hideCue(cueId: string | number) {
  const eles = this;
}
