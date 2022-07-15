//!
//! Fresh identifier generation
//!

let globalId = 0;

//! Generate new stringn identifier guaranteed to be unique across all calls
export function freshName() {
    const name = 'Id ' + globalId;
    globalId++;
    return name;
}

//! Generate new identifier number guaranteed to be unique across all cells
export function freshId() {
    const id = globalId;
    globalId++;
    return id;
}

//! Update global index to avoid overlapping with index n;
export function updateGlobalIndex(n) {
    globalId = globalId <= n ? n + 1 : globalId;
}

