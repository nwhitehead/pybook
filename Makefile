
all: generate build/localroot.zip
.PHONY:all

generate: build/out/python.asm.js
.PHONY:generate

build/out/python.asm.js: src/
	docker build . -t cpython-emscripten
	mkdir -p build
	docker create -it --name artifacts cpython-emscripten /bin/bash
	docker cp artifacts:/out build/
	docker rm -fv artifacts

serve: all
	@echo "Serving on port 8063"
	cd html; python3 -m http.server 8063
.PHONY:serve

build/localroot.zip: src/local_files src/
	cd src; zip ../build/localroot.zip -r . -i@local_files 
