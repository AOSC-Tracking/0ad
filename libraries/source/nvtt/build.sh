#!/bin/sh

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN="nvidia-texture-tools"
PV="2.1.1"
BV="1"
SRC_URI="
	https://github.com/castano/nvidia-texture-tools/releases/download/${PV}/${PN}-${PV}.tar.gz
	https://mirror.wildfiregames.com/${PN}/${PN}-${PV}.tar.gz
	"
S="${PN}"

PATCHES="
	0001-Apply-all-WFG-changes.patch
	"

# HACK: should be a global automatic install-prefix, but this avoids changing other scripts for now
INSTALL_PREFIX="${WORKDIR}"

src_configure()
{
	if [ "${OS}" = "Darwin" ]; then
		# Could use CMAKE_OSX_DEPLOYMENT_TARGET and CMAKE_OSX_SYSROOT
		# but they're not as flexible for cross-compiling
		# Disable png support (avoids some conflicts with MacPorts)
		cmake -S . B build \
			-DCMAKE_BUILD_TYPE=Release \
			-DCMAKE_INSTALL_PREFIX="${INSTALL_PREFIX}" \
			-DPNG=0
	else
		cmake -S . -B build \
			-DCMAKE_BUILD_TYPE=Release \
			-DCMAKE_INSTALL_PREFIX="${INSTALL_PREFIX}" \
			-DCMAKE_POSITION_INDEPENDENT_CODE=ON \
			-DNVTT_SHARED=1 \
			-DOpenGL_GL_PREFERENCE=GLVND
	fi
}

src_compile()
{
	cmake --build build "${JOBS}"
}

src_install()
{
	cmake --build build --target install

	mkdir -p "${INSTALL_PREFIX}/lib/pkgconfig"
	cat <<_EOF_ >"${INSTALL_PREFIX}/lib/pkgconfig/nvtt.pc"
prefix=${INSTALL_PREFIX}
exec_prefix=\${prefix}
libdir=\${exec_prefix}/lib
includedir=\${prefix}/include

Name: ${PN}
Description: A library
Version: ${PV}
Requires:
Conflicts:
Libs: -L\${libdir} -lnvcore -lnvmath -lnvimage -lnvtt
Cflags: -I\${includedir} -DNVTT_SHARED=1
_EOF_

}

pkg_build
