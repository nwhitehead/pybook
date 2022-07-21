//!
//! notebook
//!
//! Reactive data structure representing a full notebook. This is used directly by Notebook component.
//! Groups the data itself with helper functions for manipulating the data.
//!

import { reactive } from "vue";
import { freshId } from './fresh.js';

//! Create a default blank cell
//!
function newCell() {
  return {
    id: freshId(),
    source: '',
    cell_type: 'code',
    language: 'python',
    evalstate: '',
    outputs: [],
  };
}

//! Create a default new page with one cell
//!
function newPage() {
  return [ newCell() ];
}

// A notebook is an array of pages
export const state = reactive({
  select: 0,
  page: 0,
  cells: [ 
    [
      {
        id:0,
        source:String.raw`print("\x1b[30mblack\x1b[37mwhite")`,
        outputs:[ ],
        cell_type:'code',
        language:'python',
        state:'',
      },
      {
        id:1,
        source:"_That's all folks_\n\n$$ x^2 + y^2 = z^2 $$\n",
        outputs:[],
        cell_type:'markdown',
        subtype:'edit',
        language:'python',
      },
    ], [
      {
        id:2,
        source:String.raw`42\n# This is the answer`,
        outputs:[ ],
        cell_type:'code',
        language:'python',
        state:'',
      },
    ]
  ]
});

export function getPage (state, page) {
  if (page < 0 || page >= state.cells.length) {
    throw 'Could not get requested page';
  }
  return state.cells[page];
}

export function findCell (state, page, id) {
  const nbpage = getPage(state, page);
  for (let i = 0; i < nbpage.length; i++) {
    if (nbpage[i].id === id) {
      return i;
    }
  }
  throw 'Could not get requested cell';
}

export function getCell (state, page, id) {
  const nbpage = getPage(state, page);
  const cellIndex = findCell (state, page, id);
  return nbpage[cellIndex];
}

export function clearOutput (cell) {
  cell.outputs = [];
}

export function addOutput (cell, output) {
  if (cell.outputs.length === 0) {
    cell.outputs.push(output);
    return;
  }
  if (cell.outputs[cell.outputs.length - 1].name === output.name) {
    cell.outputs[cell.outputs.length - 1]['text/plain'] += output['text/plain'];
    return;
  } else {
    cell.outputs.push(output);
    return;
  }
}

export function cellPrevious (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  if (cellIndex > 0)
  {
    cellIndex--;
    while (cellIndex > 0 && nbpage[cellIndex].hidden) {
      cellIndex--;
    }
  }
  state.select = cellIndex;
}

export function cellNext (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  if (cellIndex < nbpage.length - 1)
  {
    cellIndex++;
    while (cellIndex < nbpage.length - 1 && nbpage[cellIndex].hidden) {
      cellIndex++;
    }
  }
  state.select = cellIndex;
}
