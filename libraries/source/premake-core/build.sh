#!/bin/sh

SOURCE_PATH="$(dirname "$0")/../.."
. "${SOURCE_PATH}/functions.sh"

PN=premake-core
PV=5.0.0-beta2
BV=1
SRC_URI="https://github.com/premake/premake-core/archive/refs/tags/v${PV}.tar.gz -> ${PN}-${PV}.tar.gz"

PATCHES="
	0001-Require-unistd.h-for-macosx-in-libzip.patch
	"

INSTALL_PREFIX="${WORKDIR}"

src_compile()
{
	case "${OS}" in
		Windows)
			emake -f Bootstrap.mak windows
			;;
		Darwin)
			emake -f Bootstrap.mak osx
			;;
		*)
			emake -f Bootstrap.mak linux
			;;
	esac
}

src_install()
{
	dobin bin/release/premake5
}

pkg_build
