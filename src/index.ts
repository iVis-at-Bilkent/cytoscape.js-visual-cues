// update the below line according to your own names
import { addCue, removeCue } from "./cytoscape-visual-cues";

export default function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  // update the below line according to your own names
  cytoscape("collection", "addCue", addCue);
  cytoscape("collection", "removeCue", removeCue);
}

if (typeof window["cytoscape"] !== "undefined") {
  register(window["cytoscape"]);
}
