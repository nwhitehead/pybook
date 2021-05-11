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
    'NUMBER':6
};

export const INPUT_BUFFER_SIZE = 1024;

export const sharedBuffer = new SharedArrayBuffer(signalMap.NUMBER * 4);
export const sharedArray = new Int32Array(sharedBuffer);

export const sharedInputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE);
export const sharedInputArray = new Int32Array(sharedInputBuffer);

function check(name) {
    return Atomics.load(sharedArray, signalMap[name]) !== 0;
}
function clear(name) {
    Atomics.store(sharedArray, signalMap[name], 0);
}
function set(name) {
    Atomics.store(sharedArray, signalMap[name], 1);
    Atomics.notify(sharedArray, signalMap[name]);
}

export function isInterrupt() { return check('interrupt'); }
export function clearInterrupt() { return clear('interrupt'); }
export function setInterrupt() { return set('interrupt'); }
export function isBusy() { return check('busy'); }
export function clearBusy() { return clear('busy'); }
export function setBusy() { return set('busy'); }
export function isLoading() { return check('loading'); }
export function clearLoading() { return clear('loading'); }
export function setLoading() { return set('loading'); }
export function isStarting() { return check('starting'); }
export function clearStarting() { return clear('starting'); }
export function setStarting() { return set('starting'); }

export function inputPut(value) {
    var p = Atomics.load(sharedArray, signalMap['input_end']);
    Atomics.store(sharedInputArray, p, value);
    p = (p + 1) % INPUT_BUFFER_SIZE;
    Atomics.store(sharedArray, signalMap['input_end'], p);
    Atomics.notify(sharedArray, signalMap['input_end']);
}
