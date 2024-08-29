#!/bin/sh

die()
{
	echo ERROR: "$*"
	exit 1
}

if [ "$(uname -s)" = "Darwin" ]; then
	die "This script should not be used on macOS: use build-macos-libs.sh instead."
fi

cd "$(dirname "$0")" || die
# Now in libraries/ (where we assume this script resides)

# Check for whitespace in absolute path; this will cause problems in the
# SpiderMonkey build and maybe elsewhere, so we just forbid it.
case "$(realpath .)" in
	*[[:space:]]*)
		die "Absolute path contains whitespace, which will break the build - move the game to a path without spaces"
		;;
esac

without_nvtt=false
with_system_nvtt=false
with_system_mozjs=false

JOBS=${JOBS:="-j2"}

for i in "$@"; do
	case $i in
		--without-nvtt) without_nvtt=true ;;
		--with-system-nvtt) with_system_nvtt=true ;;
		--with-system-mozjs) with_system_mozjs=true ;;
		-j*) JOBS=$i ;;
	esac
done

# Download source libs
echo "Downloading source libs..."
echo
if [ -e source/.svn ]; then
	# migrate to split libs
	git clean -dxf source
fi

# Some of our makefiles depend on GNU make, so we set some sane defaults if MAKE
# is not set.
case "$(uname -s)" in
	"FreeBSD" | "OpenBSD")
		MAKE=${MAKE:="gmake"}
		;;
	*)
		MAKE=${MAKE:="make"}
		;;
esac

export MAKE JOBS

# Build/update bundled external libraries
echo "Building third-party dependencies..."
echo

./source/cxxtest-4.4/build.sh || die "cxxtest build failed"
echo
./source/fcollada/build.sh || die "FCollada build failed"
echo
./source/glad/build.sh || die "glad build failed"
echo
if [ "$with_system_nvtt" = "false" ] && [ "$without_nvtt" = "false" ]; then
	./source/nvtt/build.sh || die "NVTT build failed"
fi
echo
./source/premake-core/build.sh || die "premake build failed"
echo
if [ "$with_system_mozjs" = "false" ]; then
	./source/spidermonkey/build.sh || die "SpiderMonkey build failed"
fi
echo
./source/valgrind/build.sh || die "valgrind build failed"

echo "Copying built files..."
# Copy built binaries to binaries/system/
if [ "$with_system_nvtt" = "false" ] && [ "$without_nvtt" = "false" ]; then
	cp source/nvtt/lib/*.so ../binaries/system/
fi
if [ "$with_system_mozjs" = "false" ]; then
	cp source/spidermonkey/bin/*.so ../binaries/system/
fi

echo "Done."
