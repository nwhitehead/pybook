generate:
	docker build . -t cpython-emscripten
	mkdir -p build
	docker create -it --name artifacts cpython-emscripten /bin/bash
	docker cp artifacts:/out build/
	docker rm -fv artifacts
.PHONY:generate

serve:
	@echo "Serving on port 8063"
	cd html; python3 -m http.server 8063
.PHONY:serve
