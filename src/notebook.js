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
  cells: [ [
    {
      id:0,
      source:'import time\nfor i in range(10):\n    print(i)\n    time.sleep(0.5)\n',
      outputs:[
        { 'text/plain': 'This is some regular text.' },
        { 'text/plain': 'This is some stderr text.', name: 'stderr' },
      ],
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
  ] ]
});

export function getCell (state, page, id) {
  if (page < 0 || page >= state.cells.length) {
    throw 'Could not get requested page';
  }
  const nbpage = state.cells[page];
  for (let i = 0; i < nbpage.length; i++) {
    if (nbpage[i].id === id) {
      return nbpage[i];
    }
  }
  throw 'Could not get requested cell';
}

export function clearOutput (cell) {
  cell.outputs = [];
}

export function addOutput (cell, output) {
  cell.outputs.push(output);
}
