//!
//! notebook
//!
//! This module is helper functions for manipulating notebook state. Actual reactive variable is in Notebook.
//!

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

export const blankState = {
  select: 0,
  page: 0,
  cells: [ newPage() ],
};

//! Set the selection
export function selectId (state, id) {
  state.select = id;
}

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
    if ('' + nbpage[i].id === '' + id) {
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
  state.select = nbpage[cellIndex].id;
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
  state.select = nbpage[cellIndex].id;
}

//! Insert new cell before selected cell
export function insertCellBefore (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  const cell = newCell();
  nbpage.splice(cellIndex, 0, cell );
  state.select = cell.id;
}

//! Insert new cell after selected cell
export function insertCellAfter (state) {
  const nbpage = getPage(state, state.page);
  let cellIndex = findCell(state, state.page, state.select);
  const cell = newCell();
  nbpage.splice(cellIndex + 1, 0, cell );
  state.select = cell.id;
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
  // Set selection to next cell (or last cell if it exists)
  if (cellIndex <= nbpage.length - 1) {
    state.select = nbpage[cellIndex].id;
  } else {
    state.select = nbpage[cellIndex - 1].id;
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

//! Update type of selected cell to make it submit area in edit mode (Python)
export function typeCellSubmitEdit (state) {
  const nbpage = getPage(state, state.page);
  let cell = getCell(state, state.page, state.select);
  cell.cell_type = 'submit';
  cell.subtype = 'edit';
  cell.language = 'python';
}

//! Update type of selected cell to make it submit area in edit mode (Python)
export function typeCellSubmitView (state) {
  const nbpage = getPage(state, state.page);
  let cell = getCell(state, state.page, state.select);
  cell.cell_type = 'submit';
  cell.subtype = 'view';
  cell.language = 'python';
}

//! Insert new page before current page (and set it to active page)
export function insertPageBefore (state) {
  const page = newPage();
  state.cells.splice(state.page, 0, page);
  selectFirst(state);
}

//! Insert new page after current page (and set it to active page)
export function insertPageAfter (state) {
  const page = newPage();
  state.cells.splice(state.page + 1, 0, page);
  pageSet(state, state.page + 1);
}

//! Delete current page (select next page if it exists, or previous page if it exists, or create blank page)
export function deletePage (state) {
  state.cells.splice(state.page, 1);
  if (state.cells.length === 0) {
    // If no pages left, make a blank one
    state.cells.splice(0, 0, newPage());
    pageSet(state, 0);
  } else {
    // Check to see if we deleted last page
    if (state.page >= state.cells.length) {
      pageSet(state, state.page = state.cells.length - 1);
    }
  }
}

//! Move current page one position earlier
export function movePageBefore (state) {
  if (state.page > 0) {
    const page = state.cells[state.page];
    // Delete page at original index
    state.cells.splice(state.page, 1);
    // Insert page at lower index
    state.cells.splice(state.page - 1, 0, page);
    // Select moved page
    pageSet(state, state.page - 1);
  }
}

//! Move current page one position later
export function movePageAfter (state) {
  if (state.page < state.cells.length - 1) {
    const page = state.cells[state.page];
    // Delete page at original index
    state.cells.splice(state.page, 1);
    // Insert page at higher index
    state.cells.splice(state.page + 1, 0, page);
    // Select moved page
    pageSet(state, state.page + 1);
  }
}

//! Select first cell on current page
export function selectFirst (state)
{
  state.select = state.cells[state.page][0].id;
}

//! Move to specific page
export function pageSet (state, p) {
  state.page = p;
  selectFirst(state);
}

//! Move to prevous page
export function pagePrevious (state) {
  if (state.page > 0) {
    state.page -= 1;
    selectFirst(state);
  }
}

//! Move to next page
export function pageNext (state) {
  if (state.page < state.cells.length - 1) {
    state.page += 1;
    selectFirst(state);
  }
}
