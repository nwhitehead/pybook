FROM ubuntu:20.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        xz-utils \
        build-essential \
        python3 \
        git \
        wget \
        zip \
        zlib1g-dev \
        libffi-dev \
        libssl-dev \
        nano \
        less \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/emscripten-core/emsdk.git
RUN emsdk/emsdk install 2.0.20
RUN emsdk/emsdk activate 2.0.20
RUN echo "source /emsdk/emsdk_env.sh --build=Release" >> ~/.bashrc

# Build python lib
COPY cpython /cpython
WORKDIR /cpython
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make"

# Build zlib, needed for zip archives in pythonpath
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make -f Makefile.zlib"

# Build a test program to cache C++ libs
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; em++ -o test.asm.js -std=c++14 -Wall /cpython/test.cpp"

# Build main app (kernel)
COPY kernel src
WORKDIR /cpython/src
RUN mkdir -p /out
## Slight hack here to prevent error message on main.bc file
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make main.bc CXX=\"em++ -c\""
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make python.asm.js -j10"
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make -j10"
# 
# Build numpy
# RUN apt update && apt install -y unzip
# COPY packages/numpy /packages/numpy
# WORKDIR /packages/numpy
# RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make"
