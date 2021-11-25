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
  imgSize: { width: number; height: number } | null;
  zoom2hide: number;
  isFixedSize: boolean;
  zIndex: number;
}

interface Cue {
  options: CueOptions;
  graphElem: any; // a cytoscape.js node or edge
}

export function addCue(cueOptions: CueOptions) {
  const eles = this;
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
