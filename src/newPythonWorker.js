import { signalMap, sharedArray, sharedInputArray, setStarting, clearBusy, setBusy, INPUT_BUFFER_SIZE } from './signal.js';

export function newPythonWorker() {
    const config = {
        absurl: document.location.protocol + '//' + document.location.host,
        sharedArray: sharedArray,
        sharedInputArray: sharedInputArray,
        signalMap: signalMap,
        INPUT_BUFFER_SIZE: INPUT_BUFFER_SIZE,
    };

    let worker = new Worker('worker.js');
    worker.postMessage(config);

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

    // Set starting, worker will clear when ready
    setStarting();
    return worker;
}
