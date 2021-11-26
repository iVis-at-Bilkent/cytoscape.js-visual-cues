// update the below line according to your own names
import { addCue, removeCue, updateCue, showCue, hideCue } from "./cytoscape-visual-cues";

export default function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  // update the below line according to your own names
  cytoscape("collection", "addCue", addCue);
  cytoscape("collection", "removeCue", removeCue);
  cytoscape("collection", "updateCue", updateCue);
  cytoscape("collection", "showCue", showCue);
  cytoscape("collection", "hideCue", hideCue);
}

if (typeof window["cytoscape"] !== "undefined") {
  register(window["cytoscape"]);
}
