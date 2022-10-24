//!
//! Parse PBNB format files
//!
//! Specification described in FileSpec.md
//!

//! Split a long text string into array of lines
export function splitByLines(txt) {
    // Remove single trailing newline if exists
    if (txt.length > 0 && txt.slice(-1) === '\n') {
        txt = txt.slice(0, txt.length - 1);
    }
    return txt.split("\n");
}

//! Determine if a line starts with special "#%" marks
export function isSpecialDelimiter(txt) {
    if (txt.length < 2) {
        return false;
    }
    return txt.substring(0, 2) === '#%';
}

//! Parse a line that is special, return object with info
//! Throws if delim not legal
export function parseSpecialDelimiterLine(txt) {
    if (!isSpecialDelimiter(txt)) {
        return null;
    }
    const parts = txt.split(' ');
    // Remove empty parts from multiple spaces in a row
    parts.filter(function(el) {
        return el !== "";
    });
    const options = parts.slice(1);
    const delim = parts[0];
    let type = '';
    // Match delim against fixed set of allowed possibilities
    const matches = {
        '#%': 'code',
        '#%%': 'markdown',
    };
    if (matches[delim] !== undefined) {
        type = matches[delim];
    } else {
        throw new Error('Unknown delimiter');
    }
    // Now handle options changing the type
    // This dictionary has key of option text that appears, value is what to make the type
    const types = {
        'md': 'markdown',
        'page': 'page',
        'end': 'end',
        'submit': 'submit',
        'user': 'user',
        'test': 'test',
    };
    Object.entries(types).forEach(([k, v]) => {
        if (options.includes(k)) {
            options.splice(options.indexOf(k), 1); // remove key from options
            type = v;
        }
    });
    const legal_options = ['hidden', 'noexec', 'auto', 'nooutput', 'readonly', 'startup'];
    const legal_key_options = ['id', 'language'];
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const spl = option.split('=');
        if (spl.length === 2) {
            if (!legal_key_options.includes(spl[0])) {
                throw new Error(`Illegal key option ${option}`);
            }
        } else {
            if (!legal_options.includes(option)) {
                throw new Error(`Illegal option ${option}`);
            }
        }
    }
    return { type, options };
}

//! Given PyBook format text described in FileSpec.md, return JS Notebook object for array of all pages
export function parsePages(text) {
    // Strategy is to accumulate lines into latest item, and items into latest page, etc.
    let pages = []; // Array of pages
    let page = []; // Array of items
    let item = []; // Array of lines
    let currentType = 'start'; // Assume we start in unknown type
    let currentOptions = [];
    function finishItem() {
        if (currentType === 'start') {
            // Ignore things before first delim
            item = [];
            currentType = '';
            currentOptions = [];
            return;
        }
        if (currentType === '') {
            item = [];
            return; // No item to finish
        }
        const itemStr = item.join('\n');
        let metadata = {};
        for (let j = 0; j < currentOptions.length; j++) {
            metadata[currentOptions[j]] = true;
        }
        let cell = { cell_type:currentType, metadata, source:itemStr, outputs:[] };
        if (currentType === 'markdown') {
            cell.metadata.subtype = 'view';
        }
        page.push(cell);
        item = [];
        currentType = '';
        currentOptions = [];
    }
    function finishPage() {
        finishItem();
        if (page.length === 0) {
            return; // No page to finish
        }
        pages.push(page);
        page = [];
    }
    const lines = splitByLines(text);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSpecialDelimiter(line)) {
            const delim = parseSpecialDelimiterLine(line);
            const matches = {
                'markdown': () => {
                    finishItem();
                    currentType = delim.type;
                    currentOptions = delim.options;
                },
                'code': () => {
                    finishItem();
                    currentType = delim.type;
                    currentOptions = delim.options;
                },
                'page': () => {
                    finishPage();
                },
                'end': () => {
                    finishItem();
                },
            };
            if (matches[delim.type] !== undefined) {
                matches[delim.type]();
            } else {
                throw new Error('Unexpected delimiter: ' + delim.type);
            }
        } else {
            item.push(line);
        }
    }
    finishPage();
    return pages;
}

//! Given PyBook format text described in FileSpec.md, return JS Notebook object for entire notebook
export function parseNotebook(text) {
    const pages = parsePages(text);
    return {
        select: pages[0][0].id,
        page: 0,
        cells: pages,
    }
}

export function parse(text) {
    return parseNotebook(text);
}

function unparseCell(cell) {
    let open = '#%%';
    let options = [];
    if (cell.cell_type === 'code') {
        open = '#%';
    }
    if (cell.metadata.hidden) {
        options.push('hidden');
    }
    if (cell.metadata.startup) {
        options.push('startup');
    }
    if (cell.metadata.submit) {
        options.push('submit');
    }
    for (let i = 0; i < options.length; i++) {
        open += ' ' + options[i];
    }
    const contents = cell.source;
    return open + '\n' + contents + '\n';
}

function unparsePage(page) {
    const cells = page;
    const cellsTxt = cells.map(unparseCell);
    return cellsTxt.join('');
}

//! Given PyBook notebook array of pages, return string in FileSpec.md format
export function unparsePages(data) {
    // Currently ignores output
    const pages = data;
    const pagesTxt = pages.map(unparsePage);
    return pagesTxt.join('#% page\n');
}

export function unparseNotebook(data) {
    return unparsePages(data.cells);
}

export function unparse(data) {
    return unparseNotebook(data);
}
