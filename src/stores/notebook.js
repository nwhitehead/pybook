import { defineStore } from 'pinia';

function newCell() {
  return {
    source: '',
    cell_type: 'code',
    language: 'python',
    evalstate: '',
    outputs: [],
  };
}

function newPage() {
  return [ newCell() ];
}

export const useNotebook = defineStore('notebook', {
    state: () => {
      return { count: 0 }
    },
    actions: {
      increment () {
        this.count++
      },
    },
  });
