PYODIDE_VERSION=0.21.0a3
PYODIDE_LOCATION=https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-build-${PYODIDE_VERSION}.tar.bz2
PBEXEC_VERSION=0.0.1

all: static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.untar lib/pyodide/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl build/out.js

static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.downloaded:
	mkdir -p lib/pyodide
	wget -O lib/pyodide/pyodide-build-${PYODIDE_VERSION}.tar.bz2 ${PYODIDE_LOCATION}
	bunzip2 lib/pyodide/pyodide-build-${PYODIDE_VERSION}.tar.bz2
	touch lib/pyodide/pyodide-build-${PYODIDE_VERSION}.downloaded

static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.untar: static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.downloaded
	tar xvf static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.tar --directory static/lib
	touch static/lib/pyodide/pyodide-build-${PYODIDE_VERSION}.untar

static/lib/pyodide/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl: $(shell find pylib/src -type f) pylib/LICENSE pylib/pyproject.toml pylib/setup.cfg pylib/README.md
	# Make sure python has latest build tools
	python3 -m pip install --upgrade build
	cd pylib; python3 -m build
	cp pylib/dist/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl static/lib/pyodide
