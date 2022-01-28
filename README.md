# cytoscape-visual-cues

## Description

A Cytoscape.js extension to show visual cues around nodes or edges. Inserts visual cues as HTML elements into the cytoscape container. You should set CSS `overflow: hidden;` for the container element since cues might overflow the cytoscape container. If you will contribute to the extension, please read the [developer guide](dev-guide.md) first.



https://user-images.githubusercontent.com/8426741/151510675-e26ed61d-49e1-42aa-8131-edb36bae4c2b.mp4



## Demo

1. Download the source codes or clone the repository with `git clone https://github.com/tarchintech/cytoscape.js-visual-cues.git`
2. Go to the root folder `cd cytoscape.js-visual-cues`
3. Run `npm install` to install the dependencies
4. Run `npm run demo`. By default it will open http://localhost:8080/demo/demo.html

## API

Adds `setActiveCueInstance` and `getActiveInstanceId` to the **cytoscape core** methods.

#### `cy.setActiveCueInstance(id: number)`

- Do not use this unless there are multiple cytoscape instances.
- Sets the active cue instance id.

#### `cy.getActiveCueInstanceId()`

- Gets the active cue instace id.

Adds `addCue`, `removeCue`, `updateCue`, `getCueData`, `showCue`, `hideCue` to the **cytoscape collection** methods.

#### `ele.addCue(cueOptions: CueOptions): boolean[]`

- Creates new cue(s) to the calling element(s).
- Returns an array of booleans. If a cue is added successfully to an element it returns true, otherwise false.

#### `ele.removeCue(cueId: string | number)`

- Deletes cue(s) from the calling element(s).
- If `cueId` is `null` or `undefined`, deletes all the cue(s).

#### `ele.updateCue(cueId: string | number)`

- Updates given properties of cue(s).
- If a cue with the id not found, updates all cues of the element.

#### `ele.getCueData(): Str2Cues`

- Gets cue data of cue(s).

#### `ele.showCue(cueId: string | number)`

- Manually shows cue(s).
- If a cue with the id `cueId` is not found, shows all the cues of the element.

#### `ele.hideCue(cueId: string | number)`

- Manually hides cue(s).
- If a cue with the id `cueId` is not found, hides all the cues of the element.

### Defined interfaces (data types) used

```js
type NodeCuePosition =
  | "top"
  | "center"
  | "bottom"
  | "right"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

type EdgeCuePosition = "target" | "source" | "center";

interface CueOptions {
  id: number | string;
  show: "select" | "hover" | "always" | "never" | "over";
  position: NodeCuePosition | EdgeCuePosition;
  marginX: string | number;
  marginY: string | number;
  onCueClicked: ((ele: any, id: number | string) => void) | undefined;
  htmlElem: HTMLElement;
  imgData: { width: number, height: number, src: string } | null;
  zoom2hide: number;
  isFixedSize: boolean;
  zIndex: number;
  tooltip: string;
  cursor: string;
}

interface Str2Cues {
  [key: string]: Cues;
}

export interface Cues {
  [key: string]: CueOptions;
}
```

## Default Options

```js
{
  show: 'always',
  isFixedSize: false,
  marginX: 0,
  marginY: 0,
  zoom2hide: 0,
  tooltip: '',
  cursor: 'initial'
}
```

## Dependencies

- Cytoscape.js ^2.7.0 || ^3.0.0

## Usage instructions

After getting a build (use `npm run build` or `npm run build-dev`), you can import the generated files under "dist" folder. It will generate CommonJS, Universal Module Definition and ES bundles.

<div align="center">
  <sub>Copyright © 2021 - present by Tarchin. All rights reserved.</sub>
</div>
