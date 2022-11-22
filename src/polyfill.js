
//! Import for side effects
//! Polyfill SharedArrayBuffer and Atomic so modules can load, but not work in insecure contexts
//!

export const hasSharedArrayBuffer = (typeof SharedArrayBuffer !== 'undefined');
globalThis.SharedArrayBuffer = hasSharedArrayBuffer ? globalThis.SharedArrayBuffer : class {};

export default {};
