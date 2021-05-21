#!/bin/bash

python3 ../emsdk/emsdk/upstream/emscripten/tools/file_packager.py \
    lib/pyodide/exec.data \
    --js-output=lib/pyodide/exec.js \
    --export-name=pyodide._module \
    --use-preload-plugins \
    --preload pylib/src/exec/@/lib/python3.8/site-packages/ \
    --lz4
