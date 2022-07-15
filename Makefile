PYODIDE_VERSION=0.21.0a3
PYODIDE_LOCATION=https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-build-${PYODIDE_VERSION}.tar.bz2

lib/pyodide/pyodide-build-${PYODIDE_VERSION}.downloaded:
	wget -O lib/pyodide/pyodide-build-${PYODIDE_VERSION}.tar.bz2 ${PYODIDE_LOCATION}
	bunzip2 lib/pyodide/pyodide-build-${PYODIDE_VERSION}.tar.bz2
	touch lib/pyodide/pyodide-build-${PYODIDE_VERSION}.downloaded
