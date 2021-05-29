//!
//! \brief Spawn a new thread
//!
//! \param opts Dictionary of arguments
//!
//! fn Function that is called to handle events
//!           fn(input, done)
//!           \param input Data sent to thread in message
//!           \param done Function called to end processing
//!           done(msg)
//! config Data that is available to thread from startup (optional)
//! setup Function to run in thread at creation to setup (optional)
//!
export function spawn(opts) {
    if (opts === undefined) {
        opts = {};
    }
    if (opts.setup === undefined) {
        setup = function(){};
    }
    if (opts.fn === undefined) {
        throw 'Need to specify fn argument to spawn';
    }
    var blob = new Blob([
        '_handler = ', opts.fn.toString(), ';',
        '_done = function(msg) { postMessage(msg); };',
        'send = function(msg) { postMessage(msg); };',
        // First message is config data
        // Make sure to set onmessage handler after calling setup
        'onmessage = function(e) {                             \
             config = e.data;                                  \
             (', opts.setup.toString(), ')();                  \
             onmessage = function(e) {                         \
               _handler(e.data, _done);                        \
             };                                                \
         };',
        ], { type: 'text/javascript' });
    var worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage(opts.config);
    worker.send = function(msg) {
        worker.postMessage(msg);
        return worker;
    };
    worker.on = function(type, handler) {
        if (type === 'message') {
            worker.onmessage = function(e) {
                handler(e.data);
            };
            return worker;
        }
        if (type === 'error') {
            worker.onerror = handler;
            console.log('error in spawned thread');
            return worker;
        }
        if (type === 'terminate') {
            worker._onterminate = handler;
        }
        throw 'Unknown message type ' + type;
    };
    worker.kill = function() {
        if (worker._onterminate) {
            worker._onterminate();
        }
        worker.terminate();
    };
    return worker;
}
