PYODIDE_VERSION=0.22.0
PYODIDE_LOCATION=https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-${PYODIDE_VERSION}.tar.bz2
PBEXEC_VERSION=0.0.1

all: public/lib/pyodide/pyodide-${PYODIDE_VERSION}.untar public/lib/pyodide/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl

public/lib/pyodide/pyodide-${PYODIDE_VERSION}.downloaded:
	mkdir -p public/lib/pyodide
	wget -O public/lib/pyodide/pyodide-${PYODIDE_VERSION}.tar.bz2 ${PYODIDE_LOCATION}
	bunzip2 public/lib/pyodide/pyodide-${PYODIDE_VERSION}.tar.bz2
	touch public/lib/pyodide/pyodide-${PYODIDE_VERSION}.downloaded

public/lib/pyodide/pyodide-${PYODIDE_VERSION}.untar: public/lib/pyodide/pyodide-${PYODIDE_VERSION}.downloaded
	tar xvf public/lib/pyodide/pyodide-${PYODIDE_VERSION}.tar --directory public/lib
	touch public/lib/pyodide/pyodide-${PYODIDE_VERSION}.untar
	cp public/lib/pyodide/pyodide.mjs static/lib/pyodide/pyodide.mjs

public/lib/pyodide/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl: $(shell find pylib/src -type f) pylib/LICENSE pylib/pyproject.toml pylib/setup.cfg pylib/README.md
	# Make sure python has latest build tools
	python3 -m pip install --upgrade build
	cd pylib; python3 -m build
	cp pylib/dist/pbexec_nwhitehead-${PBEXEC_VERSION}-py3-none-any.whl public/lib/pyodide
