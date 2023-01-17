//!
//! Parse py files in notebook format
//!
//! File format is custom, based on ideas from https://github.com/mrzv/saturn
//! Lines starting with "#m> " are for Markdown.
//! No prefix lines are Python.
//! Python can have a line like: "#p> [options]" where options is "file=FILENAME"
//! Multiple Python examples are split with "#---#"
//! Pages are split with "#---page---#"
//!
//! High-level interface: input is strings of content, output is array of pages, each page is array of cells.
//!
//! Each cell has:
//! - cell_type - 'python', 'markdown' (maybe more someday...)
//! - source - string of content of the cell (no prefix comments for Markdown)
//!
//! Python special syntax: #p> [options]
//! Currently only option is: file=FILENAME
//! All python gets collected, any with file marks are put in filesystem of all code examples.
//! This lets code be referred to from anywhere with "import" etc.

//! Split a long text string into array of lines
export function splitByLines(txt) {
    // Remove single trailing newline if exists
    if (txt.length > 0 && txt.slice(-1) === '\n') {
        txt = txt.slice(0, txt.length - 1);
    }
    return txt.split("\n");
}

//! Parse a line that is special, return object with info
//! Throws if delim not legal
export function parseSpecialDelimiterLine(txt) {
    if (txt === '#---#') {
        return 'cell';
    }
    if (txt === '#---page---#') {
        return 'page';
    }
    // Not a delimeter
    return null;
}

//! Get prefix type for line, return type and stripped line, and special options if present
//! Doesn't worry about delimiters
export function parsePrefix(text) {
    if (text === '#m>') {
        return [ 'markdown', '' ];
    }
    if (text.length >= 4 && text.slice(0, 4) === '#m> ') {
        return [ 'markdown', text.slice(4)];
    }
    if (text.length >= 4 && text.slice(0, 4) === '#p> ') {
        // No normal python text, just special options here
        return [ 'python', '', text.slice(4)];
    }
    return [ 'python', text ];
}

//! Given text, return array of all pages
//! Filename is for better error messages
export function parsePages(text, filename) {
    if (filename === undefined) {
        filename = '<notebook>';
    }
    // Strategy is to accumulate lines into latest item, and items into latest page, etc.
    let pages = []; // Array of pages
    let page = []; // Array of items
    let item = []; // Array of lines
    let currentType = ''; // Assume we start in unknown type
    let currentOptions = {}; // Array of options set for current cell

    function finishItem() {
        if (currentType === '') {
            item = [];
            currentOptions = {};
            return;
        }
        // Trim newlines at start and end of item source
        const itemStr = item.join('\n').replace(/^\s+|\s+$/g, '');
        let cell = { cell_type:currentType, source:itemStr, options:currentOptions };
        page.push(cell);
        item = [];
        currentOptions = {};
        currentType = '';
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
            // First see if it is a delimiter
            const delim = parseSpecialDelimiterLine(line);
            if (delim !== null) {
                if (delim === 'cell') {
                    finishItem();
                    currentType = '';
                } else if (delim === 'page') {
                    finishPage();
                } else {
                    throw new Error(`Unexpected delimiter ${delim}`);
                }
            } else {
                // Now look at prefixes
                let [ prefix, rest, special ] = parsePrefix(line);
                // If line is blank, just assume it matches last one
                if (rest === '' && special === undefined) {
                    prefix = currentType;
                }
                if (prefix !== currentType) {
                    if (currentType === '') {
                        currentType = prefix;
                    } else {
                        finishItem(); // We're ending one cell, starting new one by switching type
                        currentType = prefix;
                    }
                }
                item.push(rest);
                if (special !== undefined) {
                    special.split(' ').map(option => {
                        const split = option.split('=');
                        currentOptions[split[0]] = split[1];
                    });
                }
            }
        } catch (error) {
            throw new Error(`${filename}:${linenum + 1} Error parsing line ${linenum + 1}\n${error}`);
        }
    }
    finishPage();
    return pages;
}

export function parse(text) {
    return parsePages(text);
}

//! Take a multiline string (no newline at end) and indent it with a prefix on each line (returns no newline at end)
function prefixLines(prefix, txt) {
    const lines = txt.split('\n');
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        result.push(prefix + lines[i]);
    }
    return result.join('\n');
}

function unparseCell(cell) {
    const cell_type = cell['cell_type'];
    const source = cell['source'];
    if (cell_type === 'markdown') {
        return prefixLines('#m> ', source) + '\n';
    } else if (cell_type === 'python') {
        const options = cell['options'];
        let options_txt = '';
        if (options !== {}) {
            options_txt = '#p>';
            for (const [key, value] of Object.entries(options)) {
                options_txt += ' ' + key + '=' + value;
            }
            options_txt += '\n';
        }
        return source + '\n';
    }
    throw new Error(`Unknown cell type ${cell_type}`);
}

function unparsePage(cells) {
    let splitCells = [];
    let previousType = null;
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.cell_type === previousType) {
            splitCells.push('#---#\n');
        }
        previousType = cell.cell_type;
        splitCells.push(unparseCell(cell));
    }
    return splitCells.join('');
}

export function unparsePages(pages) {
    const pagesTxt = pages.map(unparsePage);
    return pagesTxt.join('#---page---#\n');
}

export function unparse(data) {
    return unparsePages(data);
}
