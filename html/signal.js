//!
//! Signal map for shared buffer.
//!
//! Lets us refer to atomic flags by name.
//!
export const signalMap = {
    'interrupt':0,
    'busy':1,
    'loading':2,
    'starting':3,
    'NUMBER':4
};

export const sharedBuffer = new SharedArrayBuffer(signalMap.NUMBER * 4);
export const sharedArray = new Int32Array(sharedBuffer);

function check(name) {
    return Atomics.load(sharedArray, signalMap[name]) !== 0;
}
function clear(name) {
    Atomics.store(sharedArray, signalMap[name], 0);
}
function set(name) {
    Atomics.store(sharedArray, signalMap[name], 1);
}
export function isInterrupt() { return check('interrupt'); }
export function clearInterrupt() { return clear('interrupt'); }
export function setInterrupt() { return set('interrupt'); }