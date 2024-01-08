// update the below line according to your own names
import {
  addCue,
  removeCue,
  updateCue,
  getCueData,
  showCue,
  hideCue,
  setActiveInstance,
  getActiveInstanceId,
  pngFull,
} from "./cytoscape-visual-cues";

export default function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  // update the below line according to your own names
  cytoscape("collection", "addCue", addCue);
  cytoscape("collection", "removeCue", removeCue);
  cytoscape("collection", "updateCue", updateCue);
  cytoscape("collection", "getCueData", getCueData);
  cytoscape("collection", "showCue", showCue);
  cytoscape("collection", "hideCue", hideCue);
  cytoscape("core", "setActiveCueInstance", setActiveInstance);
  cytoscape("core", "getActiveCueInstanceId", getActiveInstanceId);
  cytoscape("core", "pngFull", pngFull);
}

if (typeof window["cytoscape"] !== "undefined") {
  register(window["cytoscape"]);
}
