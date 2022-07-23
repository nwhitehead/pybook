//!
//! Fresh identifier generation
//!

let globalId = 0;

//! Increment globalId to avoid any "id" values in value (deeply)
function avoid(value) {
    if (value === undefined || value === null) {
        return;
    }
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            avoid(value[i]);
        }
        return;
    }
    if (typeof value === 'object') {
        for (const [key, subvalue] of Object.entries(value)) {
            if (key === 'id' && typeof subvalue === 'number') {
                globalId = globalId <= subvalue ? subvalue + 1 : globalId;
            } else {
                avoid(subvalue);
            }
        }
    }
}

//! Generate new identifier number guaranteed to be unique across all cells
//!
//! Value passed in is data that should be considered when returning fresh id
//! (blank means do not consider any new data)
//!
//! For data passed in, only objects with key "id" are counted.
//!
export function freshId(value) {
    avoid(value);
    const id = globalId;
    globalId++;
    return id;
}
