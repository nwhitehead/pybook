//!
//! Parse PBNB format files
//!
//! Specification described in FileSpec.md
//!

//! Split a long text string into array of lines
function splitByLines(txt) {
    return txt.split("\n");
}

//! Determine if a line starts with special "#%" marks
function isSpecialDelimiter(txt) {
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
    if (delim === '#%') {
        type = 'Code';
    } else {
        if (delim === '#%%') {
            type = 'Markdown';
        } else {
            if (delim === '#%page') {
                type = 'Page';
            } else {
                throw 'Unknown delimiter';
            }
        }
    }
    return { type, options };
}

export function parse(text) {
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
            throw 'No item to finish';
        }
        const itemStr = item.join('\n');
        page.push({ type:currentType, options:currentOptions, data:itemStr });
        item = [];
        currentType = '';
        currentOptions = [];
    }
    function finishPage() {
        finishItem();
        if (page.length === 0) {
            throw 'No page to finish';
        }
        pages.push(page);
        page = [];
    }
    const lines = splitByLines(text);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSpecialDelimiter(line)) {
            const delim = parseSpecialDelimiterLine(line);
            if (delim.type === 'Markdown') {
                finishItem();
                currentType = delim.type;
                currentOptions = delim.options;
            } else {
                if (delim.type === 'Code') {
                    finishItem();
                    currentType = delim.type;
                    currentOptions = delim.options;
                } else {
                    if (delim.type === 'Page') {
                        finishPage();
                    } else {
                        throw 'Unexpected delimiter';
                    }
                }
            }
        } else {
            item.push(line);
        }
    }
    finishPage();
    return pages;
}
