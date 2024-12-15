#!/bin/sh
set -e

cd "$(dirname "$0")"

LIB_VERSION=fcollada-3.0.5.9
COMMIT_HASH=3532401555cd39c01a979959c860d793804b2138

echo "Building FCollada..."
while [ "$#" -gt 0 ]; do
	case "$1" in
		--force-rebuild) rm -f .already-built ;;
		*)
			echo "Unknown option: $1"
			exit 1
			;;
	esac
	shift
done

if [ -e .already-built ] && [ "$(cat .already-built || true)" = "${LIB_VERSION}+1" ]; then
	echo "Skipping - already built (use --force-rebuild to override)"
	exit
fi

# fetch
INSTALL_DIR="$(pwd)"
LIB_DIRECTORY="$INSTALL_DIR/fcollada-$LIB_VERSION"
rm -rf "$LIB_DIRECTORY" fcollada include lib .already-built

git clone --quiet https://github.com/seragh/fcollada.git "$LIB_DIRECTORY"
git -C "$LIB_DIRECTORY" reset --hard ${COMMIT_HASH}

patch -d "$LIB_DIRECTORY" CMakeLists.txt <patches/fix-linkage.diff

# build
if [ "$(uname -s)" = "Darwin" ]; then
	# shellcheck disable=SC2086
	cmake -B "fcollada" \
		-S $LIB_DIRECTORY \
		-DBUILD_SHARED_LIBS=OFF \
		-DCMAKE_PREFIX_PATH="$LIBXML2_DIR;$FMT_DIR;$ZLIB_DIR;$ICONV_DIR" \
		-DCMAKE_INSTALL_PREFIX="$INSTALL_DIR" \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_TESTING=On \
		$CMAKE_FLAGS || exit 1
	cmake --build fcollada "${JOBS}" --target install || exit 1
	ctest --test-dir "fcollada" || exit 1
else
	# shellcheck disable=SC2086
	cmake -B "fcollada" -S "$LIB_DIRECTORY" -G "Unix Makefiles" \
		-DBUILD_SHARED_LIBS=OFF \
		-DCMAKE_BUILD_TYPE=Release \
		$CMAKE_FLAGS
	cmake --build fcollada "${JOBS}" --target install || exit 1
	ctest --test-dir "fcollada" || exit 1
fi

echo "${LIB_VERSION}" >.already-built
