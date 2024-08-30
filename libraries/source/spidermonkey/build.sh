#!/bin/sh
# This script is called by build-source-libs.sh / build-osx-libs.sh

# unreachable
# shellcheck disable=SC2317

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN="spidermonkey"
PV="28207"
BV=1
SRC_URI="svn+https://svn.wildfiregames.com/public/source-libs/trunk/spidermonkey@28207"

src_compile() {
	# TODO: jk
	./build.sh
}

src_install() {
	cp -r bin lib include-unix-debug include-unix-release "${WORKDIR}"
}

pkg_build
