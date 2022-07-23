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

const testDoc = {
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
};

freshId(testDoc);

//! A notebook is an array of pages
//!
export const state = reactive(testDoc);

console.log(state.value);
//freshId(state.);

//! Get page of cells from state
export function getPage (state, page) {
  if (page < 0 || page >= state.cells.length) {
    throw 'Could not get requested page';
  }
  return state.cells[page];
}

//! Find single cell from given page and id
//! Returns index in page
export function findCell (state, page, id) {
  const nbpage = getPage(state, page);
  for (let i = 0; i < nbpage.length; i++) {
    if (nbpage[i].id === id) {
      return i;
    }
  }
  throw 'Could not get requested cell';
}

//! Get single cell from given page and id
//! Cell may be modified directly after return
export function getCell (state, page, id) {
  const nbpage = getPage(state, page);
  const cellIndex = findCell (state, page, id);
  return nbpage[cellIndex];
}

//! Clear output of a cell
export function clearOutput (cell) {
  cell.outputs = [];
}

//! Add output to a cell
//! Consolidates streams of the same type to allow output before newlines
//! If name of stream changes, starts a new output stream (will add newline)
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

//! Select previous cell on page
//! Stops at top of page
//! Skips over hidden cells
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

//! Select next cell on page
//! Stops at bottom of page
//! Skips over hidden cells
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

//! Insert new cell before selected cell
export function insertCellBefore (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  nbpage.splice(cellIndex, 0, newCell() );
}

//! Insert new cell after selected cell
export function insertCellAfter (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  nbpage.splice(cellIndex + 1, 0, newCell() );
}

//! Delete selected cell
export function deleteCell (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  nbpage.splice(cellIndex, 1);
  // If page has no cells, add a blank one
  if (nbpage.length === 0) {
    nbpage.splice(0, 0, newCell());
  }
}

//! Move cell up one position (not off page)
export function moveCellBefore (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  if (cellIndex > 0) {
    const cell = nbpage[cellIndex];
    // Delete cell at original index
    nbpage.splice(cellIndex, 1);
    // Insert cell at lower index
    nbpage.splice(cellIndex - 1, 0, cell);
  }
}

//! Move cell down one position (not off page)
export function moveCellAfter (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  if (cellIndex < nbpage.length - 1) {
    const cell = nbpage[cellIndex];
    // Delete cell at original index
    nbpage.splice(cellIndex, 1);
    // Insert copy of cell at higher index
    nbpage.splice(cellIndex + 1, 0, cell);
  }
}

//! Update type of selected cell to make it code (Python)
export function typeCellCode (state) {
  const nbpage = getPage(state, state.page);
  let cell = getCell(state, state.page, state.select);
  cell.cell_type = 'code';
  cell.language = 'python';
}

//! Update type of selected cell to make it markdown in edit mode
export function typeCellMarkdownEdit (state) {
  const nbpage = getPage(state, state.page);
  let cell = getCell(state, state.page, state.select);
  cell.cell_type = 'markdown';
  cell.subtype = 'edit';
}

//! Update type of selected cell to make it markdown in view mode
export function typeCellMarkdownView (state) {
  const nbpage = getPage(state, state.page);
  let cell = getCell(state, state.page, state.select);
  cell.cell_type = 'markdown';
  cell.subtype = 'view';
}
