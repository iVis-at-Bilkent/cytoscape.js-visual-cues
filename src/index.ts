// update the below line according to your own names
// import { extensionConstructor } from "./cytoscape-extension-template";

export default function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  // update the below line according to your own names
  // cytoscape("core", "extensionConstructor", extensionConstructor);
}

if (typeof window["cytoscape"] !== "undefined") {
  register(window["cytoscape"]);
}
