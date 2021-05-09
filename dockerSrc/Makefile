
ROOT=$(abspath ..)

PYVERSION=3.7.10
PYMINOR=$(basename $(PYVERSION))

INSTALL=$(ROOT)/installs/python-$(PYVERSION)
LIB=libpython$(PYMINOR).a

ZLIBVERSION = 1.2.11
ZLIBBUILD=$(ROOT)/build/zlib-$(ZLIBVERSION)
ZLIBLIB=libz.a

CXX=em++
OPTFLAGS=-O2
CXXFLAGS=-std=c++14 -Wall -Werror $(OPTFLAGS) -g -I ../installs/python-$(PYVERSION)/include/python$(PYMINOR)/ -Wno-warn-absolute-paths
LDFLAGS=$(OPTFLAGS) $(INSTALL)/lib/$(LIB) $(ZLIBBUILD)/$(ZLIBLIB) \
  -s TOTAL_MEMORY=268435456 \
  -s ASSERTIONS=0 \
  -s EMULATE_FUNCTION_POINTER_CASTS=1 \
  -s "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap', 'UTF8ToString']" \
  -s "EXPORTED_FUNCTIONS=['_main', '_Kernel_new', '_Kernel_delete', '_Kernel_reset', '_Kernel_eval', '_Kernel_version', '_Result_str', '_Result_delete']" \
  --memory-init-file 0

dist: all
	cp python.asm.js /out
	cp python.asm.data /out
	cp python.asm.wasm /out
	cp ~/python$(PYMINOR).zip /out


all: python.asm.js ~/python$(PYMINOR).zip


python.asm.js: main.bc root
	$(CXX) -o $@ $(filter %.bc,$^) $(LDFLAGS) \
		$(foreach d,$(wildcard root/*),--preload-file $d@/$(notdir $d))


%.bc: %.cpp ../installs/python-$(PYVERSION)/lib/python$(PYMINOR)
	$(CXX) -o $@ $< $(CXXFLAGS)


root: ../installs/python-$(PYVERSION)/lib/python$(PYMINOR) lib_files
	mkdir -p root/lib
	tar -C ../installs/python-$(PYVERSION) -cf - --files-from lib_files | tar -C root -xvf -


../installs/python-$(PYVERSION)/lib/python$(PYMINOR):
	make -C ../$(PYVERSION)


~/python$(PYMINOR).zip: ../installs/python-$(PYVERSION)/lib/python$(PYMINOR)
	cd ../installs/python-$(PYVERSION)/lib/python$(PYMINOR) ; zip -r ~/python$(PYMINOR).zip . -i \*.py
