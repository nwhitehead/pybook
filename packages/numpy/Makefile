
ROOT=$(abspath .)

PACKAGE=numpy
PYVERSION=3.7.0
PYMINOR=$(basename $(PYVERSION))
PYINSTALL=/cpython/installs/python-$(PYVERSION)
PYTHON=/cpython/build/$(PYVERSION)/host/bin/python$(PYMINOR)

NUMPYVER=1.15.1
BUILD=$(ROOT)/build
INSTALL=$(ROOT)/install
TARBALL=$(ROOT)/downloads/$(PACKAGE).zip
URL=https://files.pythonhosted.org/packages/65/ab/4dfcc20234fae12ee40c714b98077d6e3a10652496bd1488fa4828529b22/numpy-1.15.1.zip


all: $(BUILD)/doit


$(INSTALL)/lib/$(LIB): $(BUILD)/$(LIB)
	( \
		cd $(BUILD); \
		sed -i -e 's/libinstall:.*/libinstall:/' Makefile; \
		touch $(BUILD)/$(LIB) ; \
		emmake make HOSTPYTHON=$(HOSTPYTHON) PYTHON_FOR_BUILD=$(HOSTPYTHON) CROSS_COMPILE=yes inclinstall libinstall $(LIB) && \
		cp $(LIB) $(INSTALL)/lib/ && \
		cp $(HOSTINSTALL)/lib/python$(PYMINOR)/`$(HOSTPYTHON) -c "import sysconfig; print(sysconfig._get_sysconfigdata_name())"`.py $(INSTALL)/lib/python$(PYMINOR)/_sysconfigdata__emscripten_.py; \
	)


clean:
	-rm -fr $(BUILD)
	-rm -fr $(INSTALL)


$(TARBALL):
	[ -d $(ROOT)/downloads ] || mkdir -p $(ROOT)/downloads
	wget -q -O $@ $(URL)


$(BUILD)/.patched: $(TARBALL)
	[ -d $(BUILD) ] || (mkdir -p $(BUILD); cd $(BUILD); unzip $(TARBALL))
	cat patches/*.patch | (cd $(BUILD)/numpy-$(NUMPYVER) ; patch -p1)
	touch $@


$(BUILD)/doit: $(BUILD)/.patched
#	cp config/* $(BUILD)/numpy-$(NUMPYVER)
	( \
		cd $(BUILD)/numpy-$(NUMPYVER); \
		CC=emcc AR=emar $(PYTHON) setup.py build -I math.h ; \
	)


$(BUILD)/$(LIB): $(BUILD)/Makefile $(HOSTPYTHON) $(HOSTPGEN) Setup.local
	cp Setup.local $(BUILD)/Modules/
	cat pyconfig.undefs.h >> $(BUILD)/pyconfig.h
	( \
		cp build/$(PYVERSION)/host/lib/python$(PYMINOR)/`$(HOSTPYTHON) -c "import sysconfig; print(sysconfig._get_sysconfigdata_name())"`.py build/$(PYVERSION)/Python-$(PYVERSION)/Lib/_sysconfigdata__emscripten_.py; \
		cd $(BUILD); \
		emmake make HOSTPYTHON=$(HOSTPYTHON) HOSTPGEN=$(HOSTPGEN) CROSS_COMPILE=yes $(LIB) \
	)
	touch $(BUILD)/$(LIB)
