#!/bin/sh
SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN=fcollada
PV=28207
BV=1
SRC_URI="svn+https://svn.wildfiregames.com/public/source-libs/trunk/fcollada/src@${PV}"

CXXFLAGS="${CXXFLAGS} -DLINUX -fpic"

src_configure()
{
	if [ "${OS}" = "Darwin" ]; then
		# The Makefile refers to pkg-config for libxml2, but we
		# don't have that (replace with xml2-config instead).
		sed -i.bak -e 's/pkg-config libxml-2.0/xml2-config/' Makefile
	fi

	rm -rf ../lib
	mkdir -p ../lib
}

src_install() {
	rm -rf ../include
	mkdir -p ../include
	cd FCollada || die
	find . -type f \( -name '*.h' -o -name '*.hpp' \) -exec tar -c {} + | tar -C ../../include -x
}

pkg_build
