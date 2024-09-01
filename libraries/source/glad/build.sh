#!/bin/sh

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN=glad
PV=28207
BV=1
SRC_URI="svn+https://svn.wildfiregames.com/public/source-libs/trunk/${PN}@${PV}"

src_install()
{
	rm -rf "${WORKDIR}"/include "${WORKDIR}"/src
	mv include src "${WORKDIR}"
}

pkg_build
