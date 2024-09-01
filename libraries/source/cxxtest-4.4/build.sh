#!/bin/sh

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN=cxxtest-4.4
PV=28207
BV=1
SRC_URI="svn+https://svn.wildfiregames.com/public/source-libs/trunk/${PN}@${PV}"

src_install()
{
	rm -rf "${WORKDIR:?}"/bin "${WORKDIR:?}"/cxxtest "${WORKDIR:?}"/python "${WORKDIR:?}"/test
	cp -r  bin cxxtest python test "${WORKDIR}"
}

pkg_build
