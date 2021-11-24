
function readTxtFile(file, cb) {
  const fileReader = new FileReader();
  fileReader.onload = () => {
    try {
      cb(fileReader.result);
    } catch (error) {
      console.error('Given file is not suitable.', error);
    }
  };
  fileReader.onerror = (error) => {
    console.error('File could not be read!', error);
    fileReader.abort();
  };
  fileReader.readAsText(file);
}

function str2file(str, fileName) {
  const blob = new Blob([str], { type: 'text/plain' });
  const anchor = document.createElement('a');

  anchor.download = fileName;
  anchor.href = (window.URL).createObjectURL(blob);
  anchor.dataset.downloadurl =
    ['text/plain', anchor.download, anchor.href].join(':');
  anchor.click();
}

function loadJson() {
  const inp = document.getElementById('json-file-inp');
  inp.value = '';
  inp.click();
}

function jsonFileSelected() {
  readTxtFile(document.getElementById('json-file-inp').files[0], (s) => {
    cy.$().remove();
    cy.add(JSON.parse(s));
    if (document.getElementById('cbk-run-layout').checked) {
      cy.layout({ name: 'fcose', animate: true }).run();
    } else {
      cy.fit(30);
    }
  });
}

function loadGraphML() {
  const inp = document.getElementById('graphml-file-inp');
  inp.value = '';
  inp.click();
}

function graphmlFileSelected() {
  readTxtFile(document.getElementById('graphml-file-inp').files[0], (s) => {
    cy.$().remove();
    cy.graphml({ layoutBy: 'preset' })
    cy.graphml(s);
    if (document.getElementById('cbk-run-layout').checked) {
      cy.layout({ name: 'fcose', animate: true }).run();
    } else {
      cy.fit(30);
    }
  });
}

function loadSif() {
  const inp = document.getElementById('sif-file-inp');
  inp.value = '';
  inp.click();
}

function sifFileSelected() {
  readTxtFile(document.getElementById('sif-file-inp').files[0], (s) => {
    cy.$().remove();
    cy.add(sif2cy(s));
    if (document.getElementById('cbk-run-layout').checked) {
      cy.layout({ name: 'fcose', animate: true }).run();
    } else {
      cy.fit(30);
    }
  });
}

function exportJson() {
  const json = cy.json();
  const elements = json.elements;
  if (!elements.nodes) {
    return;
  }
  str2file(JSON.stringify(elements, undefined, 4), 'sample-graph.json');
}

function exportGraphml() {
  str2file(cy.graphml(), 'sample-graph.graphml');
}

function exportSif() {
  const edges = cy.edges();
  let s = '';
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    let edgeTypes = e.classes().join(' ');
    if (edgeTypes.length < 1) {
      edgeTypes = 'edge';
    }
    s += e.source().id() + '\t' + edgeTypes + '\t' + e.target().id() + '\n';
  }
  const edgelessNodes = cy.nodes().filter(x => x.connectedEdges().length == 0);
  for (let i = 0; i < edgelessNodes.length; i++) {
    s += edgelessNodes[i].id() + '\n';
  }
  str2file(s, 'sample-graph.sif');
}

function sif2cy(text) {
  //private members
  const _getNode = function (id, nodes) {
    if (!nodes[id]) {
      nodes[id] = { id: id };
    }
    return nodes[id];
  }

  const _parse = function (line, i, links, nodes) {
    line = (line.split('\t').length > 1) ? line.split('\t') : line.split(' ');
    line = line.filter(x => x); // remove empty strings

    if (line.length < 1) {
      console.warn('SIFJS cannot parse line ' + i + ' "' + line + '"');
      return;
    } else if (line.length >= 3) {
      const source = _getNode(line[0], nodes);
      const edgeType = line[1];
      for (let j = 2; j < line.length; j++) {
        const target = _getNode(line[j], nodes);

        if (source < target) {
          links[source.id + target.id + edgeType] = { target: target.id, source: source.id, edgeType: edgeType };
        } else {
          links[target.id + source.id + edgeType] = { target: target.id, source: source.id, edgeType: edgeType };
        }
      }
    } else if (line.length == 1) {
      _getNode(line[0], nodes);
    }
  };

  let nodes = {}, links = {};

  let lines = text.split('\n').filter(x => x); // remove empty strings
  for (let i = 0; i < lines.length; i++) {
    _parse(lines[i], i, links, nodes);
  }
  let cy_nodes = [];
  let cy_edges = [];
  for (let key in nodes) {
    cy_nodes.push({ 'data': { 'name': nodes[key]['id'], 'id': nodes[key]['id'] } });
  }
  for (let key in links) {
    cy_edges.push({ 'data': links[key] });
  }

  return { 'nodes': cy_nodes, 'edges': cy_edges };
}

function loadSample(globalVarName) {
  cy.$().remove();
  cy.add(window[globalVarName]);
  if (document.getElementById('cbk-run-layout').checked) {
    cy.layout({ name: 'fcose', animate: true }).run();
  } else {
    cy.fit(30);
  }
}