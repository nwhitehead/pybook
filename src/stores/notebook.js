import { defineStore } from 'pinia';
import { freshId } from '../fresh.js';

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
let state = [ newPage() ];

export const useNotebook = defineStore('notebook', {
    state: () => {
      return {
        cells: [ newPage() ],
      };
    },
    getters: {
      cell: (state, page, id) => {
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
      },
    },
    actions: {
    },
  });
