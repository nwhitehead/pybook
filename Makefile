
all: build/out/python.asm.js build/out/python.asm.wasm build/out/python.asm.data build/localroot.zip
.PHONY:all

build/out/python.asm.js build/out/python.asm.wasm build/out/python.asm.data: kernel/ Dockerfile cpython/* cpython/patches/*
	docker build . -t cpython-emscripten
	mkdir -p build
	docker create -it --name artifacts cpython-emscripten /bin/bash
	docker cp artifacts:/out build/
	docker rm -fv artifacts

# Assumes you have already tagged cpython-emscripten:custom
custom:
	mkdir -p build
	docker create -it --name artifacts cpython-emscripten:custom /bin/bash
	docker cp artifacts:/out build/
	docker rm -fv artifacts
.PHONY:custom

serve: all
	python3 server.py --port=8063 --directory=web
.PHONY:serve

build/localroot.zip: localroot/
	cd localroot; zip ../build/localroot.zip -r .
