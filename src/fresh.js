let globalId = 0;

//!
//! Generate new identifier guaranteed to be unique across all calls
//!
export function freshName() {
    const name = 'Id ' + globalId;
    globalId++;
    return name;
}
