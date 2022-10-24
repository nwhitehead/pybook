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
    const parts = txt.split(' ').filter((el) => el !== '');
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
export function parsePages(text, filename) {
    if (filename === undefined) {
        filename = '<notebook>';
    }
    // Strategy is to accumulate lines into latest item, and items into latest page, etc.
    let pages = []; // Array of pages
    let page = []; // Array of items
    let test_page = [];
    let item = []; // Array of lines
    let currentType = 'start'; // Assume we start in unknown type
    let currentOptions = [];
    let idnum = 1;
    let ids = {};

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
        // trim off newlines at start and end
        const itemStr = item.join('\n').replace(/^\s+|\s+$/g, '');
        let cell = { id:idnum, cell_type:currentType, source:itemStr, outputs:[] };
        for (let j = 0; j < currentOptions.length; j++) {
            const option = currentOptions[j];
            const spl = option.split('=');
            if (spl.length === 2) {
                cell[spl[0]] = spl[1];
            } else {
                cell[option] = true;
            }
        }
        if (cell['cell_type'] === 'test') {
            cell['id'] = `test_${cell['id']}`
        }
        if (ids[cell['id']]) {
            throw new Error(`Identifier is not unique ${cell['id']}`);
        }
        ids[cell['id']] = true;
        idnum += 1
        if (currentType == 'markdown' && cell['subtype'] === undefined) {
            cell['subtype'] = 'view';
        }
        if (cell['cell_type'] === 'submit') {
            cell['user'] = '';
            if (page.length > 0) {
                const last = page[page.length - 1];
                if (last['cell_type'] === 'user') {
                    cell['user'] = last['source'];
                    cell['id'] = last['id'];
                    page.pop();
                }
            }
        }
        if (cell['cell_type'] == 'test') {
            test_page.push(cell);
        } else {
            page.push(cell);
        }
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
    for (let linenum = 0; linenum < lines.length; linenum++) {
        const line = lines[linenum];
        try {
            if (isSpecialDelimiter(line)) {
                const delim = parseSpecialDelimiterLine(line);
                if (delim.type === 'markdown' || delim.type === 'code' || delim.type === 'submit' || delim.type === 'user' || delim.type === 'test') {
                    finishItem();
                    currentType = delim.type;
                    currentOptions = delim.options;
                } else if (delim.type === 'page') {
                    finishPage();
                } else if (delim.type === 'end') {
                    finishItem();
                } else {
                    throw new Error(`Unexpected delimiter type ${delim.type}`);
                }
            } else {
                item.push(line);
            }
        } catch (error) {
            throw new Error(`${filename}:${linenum + 1} Error parsing line ${linenum + 1}\n${error}`);
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
    let options = [ '' ]; // This will generate leading space when joined
    if (cell.hidden) {
        options.push('hidden');
    }
    if (cell.startup) {
        options.push('startup');
    }
    const optiontxt = options.join(' ');
    if (cell['cell_type'] === 'markdown') {
        return `#%%${optiontxt}\n${cell['source']}\n`;
    } else if (cell['cell_type'] === 'code') {
        return `#%${optiontxt}\n${cell['source']}\n`;
    } else if (cell['cell_type'] === 'submit') {
        return `#% user${optiontxt}\n${cell['user']}\n#% submit ${optiontxt}\n${cell['source']}\n`;
    }
    throw new Error(`Unknown cell type ${cell['cell_type']}`);
}

function unparsePage(cells) {
    const cellsTxt = cells.map(unparseCell);
    return cellsTxt.join('');
}

//! Given PyBook notebook array of pages, return string in FileSpec.md format
export function unparsePages(pages) {
    // Currently ignores output
    const pagesTxt = pages.map(unparsePage);
    return pagesTxt.join('#% page\n');
}

export function unparseNotebook(data) {
    return unparsePages(data.cells);
}

export function unparse(data) {
    return unparseNotebook(data);
}
