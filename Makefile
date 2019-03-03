
all: generate build/localroot.zip
.PHONY:all

generate: build/out/python.asm.js
.PHONY:generate

build/out/python.asm.js: dockerSrc/ Dockerfile cpython
	docker build . -t cpython-emscripten
	mkdir -p build
	docker create -it --name artifacts cpython-emscripten /bin/bash
	docker cp artifacts:/out build/
	docker rm -fv artifacts

serve: all
	python3 server.py --port=8063 --directory=html
.PHONY:serve

localroot: build/localroot.zip
.PHONY:localroot

build/localroot.zip: src/ src/dill/
	cd src; zip ../build/localroot.zip -r .
