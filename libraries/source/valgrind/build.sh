#!/bin/sh

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN=valgrind
PV=28207
BV=1
SRC_URI="svn+https://svn.wildfiregames.com/public/source-libs/trunk/${PN}@${PV}"

src_install()
{
	cd "${WORKDIR}" ||die
	rm -rf valgrind
	mv "${S}" valgrind
}

pkg_build
