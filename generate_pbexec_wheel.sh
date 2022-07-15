#!/bin/bash

# Make sure python has latest build tools
python3 -m pip install --upgrade build

# Build the pbexec wheel
cd pylib; python3 -m build

# Copy wheel into pyodide package location
cp dist/pbexec*.whl ../lib/pyodide
