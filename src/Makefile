PYVERSION=3.5.2
PYMINOR=$(basename $(PYVERSION))

CC=emcc
OPTFLAGS=-O2
CFLAGS=-std=gnu99 $(OPTFLAGS) -g -I ../../installs/python-$(PYVERSION)/include/python$(PYMINOR)/ -Wno-warn-absolute-paths
LDFLAGS=$(OPTFLAGS) ../../installs/python-$(PYVERSION)/lib/libpython$(PYMINOR).a \
  -s TOTAL_MEMORY=268435456 \
  -s ASSERTIONS=2 \
  -s EMULATE_FUNCTION_POINTER_CASTS=1 \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" \
  -s "EXPORTED_FUNCTIONS=['_main', '_PyRun_SimpleString']" \
  -s BUILD_AS_WORKER=1 \
  --memory-init-file 0

dist: all
	cp python.asm.js /out
	cp python.asm.data /out
	cp python.asm.wasm /out

all: python.asm.js


python.asm.js: main.bc root
	$(CC) -o $@ $(filter %.bc,$^) $(LDFLAGS) \
		$(foreach d,$(wildcard root/*),--preload-file $d@/$(notdir $d))


%.bc: %.c ../../installs/python-$(PYVERSION)/lib/python$(PYMINOR)
	$(CC) -o $@ $< $(CFLAGS)


root: ../../installs/python-$(PYVERSION)/lib/python$(PYMINOR) lib_files
	mkdir -p root/lib
	tar -C ../../installs/python-$(PYVERSION) -cf - --files-from lib_files | tar -C root -xvf -
#	cp -r ../../installs/python-3.5.2/lib/python3.5/ root/lib


../../installs/python-$(PYVERSION)/lib/python$(PYMINOR):
	make -C ../../$(PYVERSION)
