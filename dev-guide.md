# Developer Guide

You can read [demo guide](demo/README.md) for more information about demo.
Firstly after you generated your own repository from this template, rename `cytoscape-extension-template` and `cytoscape.js-extension-template` strings inside all files (You can use `Ctrl+Shift+F` in a modern editor).

## npm scripts

`npm run demo`: Primary command for development. As you save the source codes, it builds the bundles and refreshes the demo page. If you just change the demo files, it won't build the bundles but still refreshes the demo page.

`npm run build`: Primary command for generating production bundles. Builds 3 (CommonJS, Universal Module Definition, and ES bundles) minified, uglified bundles inside `dist` folder.

`npm run build-dev`: Builds 3 (CommonJS, Universal Module Definition, and ES bundles) bundles (not minified) inside `dist` folder. You might want to use these bundles in testing/development.

`npm run dev`: You might run this command to generate bundles automatically as you save source codes.

`npm run test`: Executes unit tests and outputs the results to the console.

`npm run cy`: Opens cypress for running end-to-end tests.

`npm run e2e`: Executes end-to-end tests and outputs results to a file named 'e2e-test-results.txt'

---

<div align="center">
  <sub>Copyright © 2021 - present by Tarchin. All rights reserved.</sub>
</div>
