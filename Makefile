
all: generate localroot
.PHONY:all

generate: build/out/python.asm.js
.PHONY:generate

build/out/python.asm.js: dockerSrc/ Dockerfile cpython/* cpython/patches/*
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
	python3 server.py --port=8063 --directory=html
.PHONY:serve

localroot: build/localroot.zip
.PHONY:localroot

build/localroot.zip: src/
	cd src; zip ../build/localroot.zip -r .
