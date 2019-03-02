FROM ubuntu:16.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        xz-utils \
        git \
        python2.7 python2.7-dev \
    && ln -sf -T python2.7 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/emscripten-core/emsdk.git
RUN emsdk/emsdk install latest
RUN emsdk/emsdk activate latest
RUN echo "source /emsdk/emsdk_env.sh --build=Release" >> ~/.bashrc

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    wget

RUN apt-get install -y --no-install-recommends \
    python3.5

COPY cpython /cpython

WORKDIR /cpython

RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make"

RUN apt-get install -y --no-install-recommends \
    zip

COPY dockerSrc src

WORKDIR /cpython/src

RUN mkdir -p /out

RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make python.asm.js"
RUN /bin/bash -c "source /emsdk/emsdk_env.sh --build=Release; make"
