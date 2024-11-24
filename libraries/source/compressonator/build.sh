#!/bin/sh
set -e

cd "$(dirname "$0")"

PV=4.5.52
LIB_VERSION=${PV}
JOBS=${JOBS:="-j2"}
MAKE=${MAKE:="make"}

if [ -e .already-built ] && [ "$(cat .already-built || true)" = "${LIB_VERSION}" ]; then
	echo "compressonator is already up to date."
	exit
fi

# fetch
if [ ! -e compressonator-${PV}.tar.gz ]; then
	curl -fLo compressonator-${PV}.tar.gz \
		https://github.com/GPUOpen-Tools/compressonator/archive/refs/tags/V${PV}.tar.gz
fi

# unpack
rm -rf src
mkdir src
tar xf compressonator-${PV}.tar.gz -C src

# configure
rm -rf build

# patch

patch -d "src/compressonator-${PV}" -p1 <patches/disable-sse.patch

# shellcheck disable=SC2086
cmake -S src/compressonator-${PV} -B build \
	-DLIB_BUILD_CORE=ON \
	-DLIB_BUILD_FRAMEWORK_SDK=ON \
	-DOPTION_ENABLE_ALL_APPS=OFF \
	-DOPTION_BUILD_INTERNAL_CMP_TEST=OFF \
	-DCMAKE_C_FLAGS="$CFLAGS" \
	-DCMAKE_CXX_FLAGS="$CXXFLAGS" \
	-DCMAKE_INSTALL_PREFIX="$(pwd)" \
	$CMAKE_FLAGS

# build
cmake --build build

# install
rm -rf include lib
mkdir include lib
cp src/compressonator-${PV}/cmp_compressonatorlib/compressonator.h include
cp build/lib/libCMP_Core.a lib
cp build/lib/libCMP_Framework.a lib

echo "${PV}" >.already-built
