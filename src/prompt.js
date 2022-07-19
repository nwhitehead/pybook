
export function Prompt (opts) {
    if (opts.xterm === undefined) {
        throw "Must set xterm option for Prompt";
    }
    if (opts.handleInput === undefined) {
        throw "Must set handleInput function option for Prompt";
    }

    // Keep track of current entry line
    let currentEntry = '';
    // Keep track of cursor position in entry line (0 is insert before first character)
    let cursor = 0;
    // Keep track of history
    let history = [];
    let historyPosition = 0;

    function updateLine() {
        console.log(currentEntry, cursor);
        // Move cursor to start of line, write entire line, with space to delete any moving stuff
        opts.xterm.write('\r' + opts.prompt + currentEntry + ' ');
        // Move cursor to correct position
        opts.xterm.write('\u001b[' + (currentEntry.length - cursor + 1) + 'D');
    }
    let acceptingInput = false;
    return {
        showPrompt: function (msg) {
            opts.prompt = msg;
            currentEntry = '';
            cursor = 0;
            updateLine();
            acceptingInput = true;
        },
        onKey: function (event) {
            if (acceptingInput) {
                const key = event.domEvent.key;
                if (key === 'Enter') {
                    opts.xterm.write('\r\n');
                    opts.handleInput(currentEntry);
                    currentEntry = '';
                    cursor = 0;
                    acceptingInput = false;
                } else if (key === 'Backspace') {
                    if (currentEntry && currentEntry !== '' && cursor > 0) {
                        currentEntry = currentEntry.slice(0, cursor - 1) + currentEntry.slice(cursor, currentEntry.length);
                        cursor -= 1;
                        updateLine();
                    }
                } else if (key === 'ArrowLeft') {
                    if (cursor > 0) {
                        cursor -= 1;
                        updateLine();
                    }
                } else if (key === 'ArrowRight') {
                    if (cursor < currentEntry.length) {
                        cursor += 1;
                        updateLine();
                    }
                } else if (key && key.length === 1) {
                    currentEntry = currentEntry.slice(0, cursor) + event.key + currentEntry.slice(cursor, currentEntry.length);
                    cursor += 1;
                    updateLine();
                }
            }
        },
    };
}
