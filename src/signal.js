//!
//! Signal map for shared buffer.
//!
//! Lets us refer to atomic flags by name.
//! Also holds shared input buffer for stdin keystrokes.
//!
export const signalMap = {
    'interrupt':0,
    'busy':1,
    'loading':2,
    'starting':3,
    'input_start':4,
    'input_end':5,
    'input_waiting':6,
    'io_complete':7,
    'NUMBER':8
};

export const INPUT_BUFFER_SIZE = 1024;

export const sharedBuffer = new SharedArrayBuffer(signalMap.NUMBER * 4);
export const sharedArray = new Int32Array(sharedBuffer);

export const sharedInputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE);
export const sharedInputArray = new Int32Array(sharedInputBuffer);

export const FILE_BUFFER_SIZE = 1024 * 1024 * 16;
export const sharedFileBuffer = new SharedArrayBuffer(FILE_BUFFER_SIZE);
export const sharedFileArray = new Uint8Array(sharedFileBuffer);
export const sharedFileSizeBuffer = new SharedArrayBuffer(4);
export const sharedFileSizeArray = new Uint32Array(sharedFileSizeBuffer);

function check(name) {
    return Atomics.load(sharedArray, signalMap[name]) !== 0;
}
function clear(name) {
    Atomics.store(sharedArray, signalMap[name], 0);
}
function set(name, number) {
    if (number === undefined) {
        number = 2; // 2 is sigint for interrupt, see pyodide.setInterruptBuffer docs
    }
    Atomics.store(sharedArray, signalMap[name], number);
    Atomics.notify(sharedArray, signalMap[name]);
}

export function isInterrupt() { return check('interrupt'); }
export function clearInterrupt() { return clear('interrupt'); }
export function setInterrupt(number) { return set('interrupt', number); }
export function isBusy() { return check('busy'); }
export function clearBusy() { return clear('busy'); }
export function setBusy() { return set('busy'); }
export function isLoading() { return check('loading'); }
export function clearLoading() { return clear('loading'); }
export function setLoading() { return set('loading'); }
export function isStarting() { return check('starting'); }
export function clearStarting() { return clear('starting'); }
export function setStarting() { return set('starting'); }
export function isInputWaiting() { return check('input_waiting'); }
export function clearInputWaiting() { return clear('input_waiting'); }
export function setInputWaiting() { return set('input_waiting'); }
export function isIOComplete() { return check('io_complete'); }
export function clearIOComplete() { return clear('io_complete'); }
export function setIOComplete() { return set('io_complete'); }


//!
//! Push input character to buffer
//!
//! The expected usage is to call this function several times with various ASCII numerical values,
//! then call it with 0 to flush the input buffer.
//!
export function inputPut(value) {
    var p = Atomics.load(sharedArray, signalMap['input_end']);
    Atomics.store(sharedInputArray, p, value);
    p = (p + 1) % INPUT_BUFFER_SIZE;
    Atomics.store(sharedArray, signalMap['input_end'], p);
    Atomics.notify(sharedArray, signalMap['input_end']);
}

//!
//! Set file upload data
//!
//! Caller is responsible for atomic sync to read these contents from other contexts
//!
export function setFileUploadData(data) {
    sharedFileArray.set(data);
    Atomics.store(sharedFileSizeArray, 0, data.length);
}
