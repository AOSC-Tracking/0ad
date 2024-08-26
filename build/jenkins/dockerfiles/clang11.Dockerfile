FROM buster-base:latest

ARG DEBIAN_FRONTEND=noninteractive
ARG DEBCONF_NOWARNINGS="yes"
RUN apt-get update && apt-get install -qqy llvm-11 clang-11 lld-11 libclang-11-dev --no-install-recommends

USER builder

ENV CC clang-11
ENV CXX clang++-11
ENV LDFLAGS -fuse-ld=lld-11
