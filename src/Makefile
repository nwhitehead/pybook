PYVERSION=3.5.2
PYMINOR=$(basename $(PYVERSION))

CXX=em++
OPTFLAGS=-O2
CXXFLAGS=-std=c++14 -Wall -Werror $(OPTFLAGS) -g -I ../../installs/python-$(PYVERSION)/include/python$(PYMINOR)/ -Wno-warn-absolute-paths
LDFLAGS=$(OPTFLAGS) ../../installs/python-$(PYVERSION)/lib/libpython$(PYMINOR).a \
  -s TOTAL_MEMORY=268435456 \
  -s ASSERTIONS=2 \
  -s EMULATE_FUNCTION_POINTER_CASTS=1 \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap', 'UTF8ToString']" \
  -s "EXPORTED_FUNCTIONS=['_main', '_Kernel_new', '_Kernel_delete', '_Kernel_eval', '_Result_str', '_Result_delete']" \
  -s BUILD_AS_WORKER=1 \
  --memory-init-file 0

dist: all
	cp python.asm.js /out
	cp python.asm.data /out
	cp python.asm.wasm /out

all: python.asm.js


python.asm.js: main.bc root
	$(CXX) -o $@ $(filter %.bc,$^) $(LDFLAGS) \
		$(foreach d,$(wildcard root/*),--preload-file $d@/$(notdir $d))


%.bc: %.cpp ../../installs/python-$(PYVERSION)/lib/python$(PYMINOR)
	$(CXX) -o $@ $< $(CXXFLAGS)


root: ../../installs/python-$(PYVERSION)/lib/python$(PYMINOR) lib_files
	mkdir -p root/lib
	tar -C ../../installs/python-$(PYVERSION) -cf - --files-from lib_files | tar -C root -xvf -

../../installs/python-$(PYVERSION)/lib/python$(PYMINOR):
	make -C ../../$(PYVERSION)
