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
    if (delim !== '#%' && delim !== '#%%') {
        throw "Unknown delimiter";
    }
    let type = (delim === '#%' ? 'Markdown' : (delim === '#%%' ? 'Code' : 'Unknown'));
    return { type, options };
}

export function parse(text) {
    const lines = splitByLines(text);
    return lines;
}
