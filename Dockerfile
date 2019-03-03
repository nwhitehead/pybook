FROM ubuntu:16.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        xz-utils \
        build-essential \
        python2.7 \
        git \
        wget \
        zip \
        zlib1g-dev \
        libffi-dev \
        nano \
        less \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/emscripten-core/emsdk.git
RUN ln -sf -T python2.7 /usr/bin/python
RUN emsdk/emsdk install latest
RUN emsdk/emsdk activate latest
RUN echo "source /emsdk/emsdk_env.sh --build=Release" >> ~/.bashrc

COPY cpython /cpython

WORKDIR /cpython

RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make || echo FAILED"

COPY Makefile.zlib /cpython

RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make -f Makefile.zlib || echo FAILED"

COPY test.cpp /cpython/src/test.cpp
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; em++ -o test.asm.js -std=c++14 -Wall /cpython/src/test.cpp"

COPY dockerSrc src
WORKDIR /cpython/src
RUN mkdir -p /out
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make python.asm.js -j10"
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make -j10"
