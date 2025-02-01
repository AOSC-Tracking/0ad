#!/bin/sh
set -e

: "${OS:=$(uname -s)}"
: "${TAR:=tar}"

cd "$(dirname "$0")"

PV=3.2.12
LIB_VERSION=${PV}+wfg0

fetch()
{
	curl -fLo "SDL3-${PV}.tar.gz" \
		"https://libsdl.org/release/SDL3-${PV}.tar.gz"
}

while [ "$#" -gt 0 ]; do
	case "$1" in
		--fetch-only)
			fetch
			exit
			;;
		--force-rebuild) rm -f .already-built ;;
		*)
			echo "Unknown option: $1"
			exit 1
			;;
	esac
	shift
done

echo "Building SDL3..."
if [ -e .already-built ] && [ "$(cat .already-built || true)" = "${LIB_VERSION}" ]; then
	echo "Skipping - already built (use --force-rebuild to override)"
	exit
fi

# fetch
if [ ! -e "SDL3-${PV}.tar.gz" ]; then
	fetch
fi

# unpack
rm -Rf "SDL3-${PV}"
"${TAR}" xf "SDL3-${PV}.tar.gz"

# configure
rm -Rf build

if [ "${OS}" = "Darwin" ]; then
	SDL_EXTRA_ARGS="${SDL_EXTRA_ARGS} -DSDL_STATIC=ON"
	SDL_EXTRA_ARGS="${SDL_EXTRA_ARGS} -DSDL_SHARED=OFF"
	SDL_EXTRA_ARGS="${SDL_EXTRA_ARGS} -DSDL_FRAMEWORK=OFF"
fi

# shellcheck disable=SC2086
cmake -B build -S "SDL3-${PV}" \
	-DCMAKE_INSTALL_PREFIX="$(realpath . || true)" \
	-DCMAKE_INSTALL_LIBDIR=lib \
	-DSDL_RPATH=OFF \
	-DSDL_ALSA_SHARED=OFF \
	-DSDL_HIDAPI_LIBUSB_SHARED=OFF \
	-DSDL_JACK_SHARED=OFF \
	-DSDL_KMSDRM_SHARED=OFF \
	-DSDL_PIPEWIRE_SHARED=OFF \
	-DSDL_PULSEAUDIO_SHARED=OFF \
	-DSDL_SNDIO_SHARED=OFF \
	-DSDL_WAYLAND_LIBDECOR_SHARED=OFF \
	-DSDL_WAYLAND_SHARED=OFF \
	-DSDL_X11_SHARED=OFF \
	-DSDL_RENDER_VULKAN=ON \
	-DSDL_HIDAPI=ON \
	-DSDL_GPU=OFF \
	-DSDL_METAL=OFF \
	${SDL_EXTRA_ARGS}

# build
cmake --build build

# install
rm -Rf include lib
cmake --install build

echo "${LIB_VERSION}" >.already-built
