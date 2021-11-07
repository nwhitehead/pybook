//!
//! \brief Fun function after DOM ready
//!
//! Standard way to wait, uses window.onload.
//!
//! \param f Function to run after ready
//!
export function onready(f) {
    if (window.onload) {
        let curronload = window.onload;
        let newonload = function(evt) {
            curronload(evt);
            f(evt);
        };
        window.onload = newonload;
    } else {
        window.onload = f;
    }
}
