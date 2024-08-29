#!/bin/sh
# allow use of local keyword
# shellcheck disable=SC3043

WORKDIR="$(realpath "$(dirname "$0")")"

: "${JOBS:=-j}"
: "${MAKE:=make}"
: "${OS:=$(uname -s)}"
: "${CFLAGS:=}"
: "${CXXFLAGS:=}"
: "${LDFLAGS:=}"
: "${INSTALL_PREFIX:="${WORKDIR}/../../install-prefix"}"

die()
{
	[ -n "$*" ] && echo ERROR: "$*"
	exit 1
}

_print_build_env()
{
	printf "###############################################################################\n"
	printf "%20s : %s\n" "JOBS" "${JOBS}"
	printf "%20s : %s\n" "MAKE" "${MAKE}"
	printf "%20s : %s\n" "OS" "${OS}"
	printf "%20s : %s\n" "CFLAGS" "${CFLAGS}"
	printf "%20s : %s\n" "CXXFLAGS" "${CXXFLAGS}"
	printf "%20s : %s\n" "LDFLAGS" "${LDFLAGS}"
	printf "%20s : %s\n" "INSTALL_PREFIX" "${INSTALL_PREFIX}"
	printf "###############################################################################\n"
}

###############################################################################
# Compile Helpers
###############################################################################
# shellcheck disable=SC2120
emake()
{
	[ -z "$*" ] && [ ! -e Makefile ] && die
	${MAKE} "${JOBS}" CFAGS="${CFLAGS}" CXXFLAGS="${CXXFLAGS}" "$@" || die
}

###############################################################################
# Install Helpers
###############################################################################
dobin()
{
	mkdir -p "${INSTALL_PREFIX}"/bin/
	cp "$1" "${INSTALL_PREFIX}"/bin/

}

dolib()
{
	mkdir -p "${INSTALL_PREFIX}"/lib/
	cp "$1" "${INSTALL_PREFIX}"/lib/

}

###############################################################################
# SRC_URI Helpers
###############################################################################

_src_uri_get_format()
{
	# shellcheck disable=SC2086
	set -- ${SRC_URI}
	case "$1" in
		*tar.gz)
			printf %s tar.gz
			;;
		svn+*)
			printf "%s" cp
			;;
		*)
			die "Unsupported package format"
			;;
	esac
}

_src_uri_get_proto()
{
	# shellcheck disable=SC2086
	set -- ${SRC_URI}
	case $1 in
		https://* | http://*)
			printf %s http
			;;
		svn+*)
			printf %s svn
			;;
		*)
			die "Unknown protocol"
			;;
	esac

}

_src_uri_get_uris_http()
{
	local uris
	# shellcheck disable=SC2086
	set -- ${SRC_URI}
	for i in "$@"; do
		if [ "${i}" = "->" ]; then
			break
		fi
		uris="${uris} ${i}"
	done
	printf %s "${uris}"

}

_src_uri_get_uris_svn()
{
	# shellcheck disable=SC2086
	set -- ${SRC_URI}
	printf "%s" "$1" | sed -e 's/^svn+//'
}

_src_uri_get_uris()
{
	case $(_src_uri_get_proto) in
		http)
			_src_uri_get_uris_http || die
			;;
		svn)
			_src_uri_get_uris_svn || die
			;;
	esac
}

_src_uri_get_target()
{
	local has_target
	local target
	# shellcheck disable=SC2086
	set -- ${SRC_URI}
	for i in "$@"; do
		if [ "${i}" = "->" ]; then
			has_target=true
			continue
		fi
		if [ "${has_target}" = "true" ]; then
			target="${i}"
		fi
	done
	if [ "${has_target}" != "true" ]; then
		target="$(printf '%s' "$1" | grep -o '[^/]*$')"
	fi

	printf %s "${target}"
}

###############################################################################
# Phase Functions
###############################################################################
_src_fetch_http()
{
	local uris
	local target

	target=$(_src_uri_get_target)

	if [ -e "${target}" ]; then
		return
	fi

	for uri in $(_src_uri_get_uris); do
		curl -fLo "${target}" "${uri}" && break
	done

	if [ ! -e "${target}" ]; then
		die
	fi
}

_src_fetch_svn()
{
	svn co "$(_src_uri_get_uris)" "${PN}-svn" || die
}

_src_fetch()
{
	case "$(_src_uri_get_proto)" in
		http)
			_src_fetch_http || die
			;;
		svn)
			_src_fetch_svn || die
			;;
		*)
			die
			;;
	esac
}

_src_unpack()
{
	local target
	rm -rf "${S:-${PN}-${PV}}"
	target="$(_src_uri_get_target)"
	case "$(_src_uri_get_format)" in
		tar.gz)
			tar -xf "${target}"
			;;
		cp)
			cp -r "${PN}-svn" "${PN}-${PV}"
			;;
	esac
}

_src_setup()
{
	for p in ${PATCHES}; do
		patch -p1 <"../patches/${p}" || die
	done
}

src_configure()
{
	:
}

# shellcheck disable=SC2120
src_compile()
{
	[ ! -e Makefile ] && return
	emake || die
}

src_install()
{
	:
}

pkg_build()
{
	if [ -e "${WORKDIR}"/.already-built ] && [ "$(cat "${WORKDIR}"/.already-built)" = "${PV}.wfg${BV}" ]; then
		echo "${PN} is already up to date."
		exit
	fi

	: "${S:=${PN}-${PV}}"
	: "${WS:=${WORKDIR}/${S}}"

	_print_build_env
	(
		cd "${WORKDIR}"
		_src_fetch
	) || die "failed _src_fetch"
	(
		cd "${WORKDIR}"
		_src_unpack
	) || die "failed _src_unpack"
	(
		cd "${WS}"
		_src_setup
	) || die "failed _src_setup"
	(
		cd "${WS}" || die
		src_configure || die
	) || die "failed src_configure"
	(
		cd "${WS}" || die
		src_compile || die
	) || die "failed src_compile"
	(
		cd "${WS}" || die
		src_install || die
	) || die "failed src_install"

	echo "${PV}.wfg${BV}" >"${WORKDIR}"/.already-built
}
