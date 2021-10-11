#!/bin/bash

python3 $EMSDK/upstream/emscripten/tools/file_packager.py \
    lib/pyodide/pbexec.data \
    --js-output=lib/pyodide/pbexec.js \
    --export-name=pyodide._module \
    --use-preload-plugins \
    --preload pylib/src/pbexec/@/lib/python3.8/site-packages/ \
    --lz4
