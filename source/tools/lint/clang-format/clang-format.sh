#!/bin/sh
set -e

cd "$(dirname "$0")/../../../.." || exit 1

while [ "$#" -gt 0 ]; do
	case "$1" in
		--from)
			from_commitish=$2
			shift
			;;
		--to)
			to_commitish=$2
			shift
			;;
		-j*) ;;
		*)
			printf "Unknown option: %s\n\n" "$1"
			exit 1
			;;
	esac
	shift
done

if [ -n "${from_commitish}" ]; then
	if [ -n "${to_commitish}" ]; then
		diff="${from_commitish}..${to_commitish}"
	else
		diff="${from_commitish}..$(git rev-parse HEAD)"
	fi
	printf "Running clang-format linter for range\n%s\n\n" "${diff}"
fi

if [ -n "${diff}" ]; then
	git diff --name-status --no-renames "${diff}" |
		awk '!/^D/{if ($2 ~ /(\.cpp|\.h)$/) {print "./" $2}}' |
		xargs clang-format --dry-run --style=file -i
else
	echo "WARNING: running clang-format linter without base commit, likely not what you want."
	find . \( -name '*.cpp' -o -name '*.h' \) >clang-format-file-list.txt
	awk '!/^\.\/(binaries|build|libraries|source\/third_party)\//' <cppcheck-file-list.txt >clang-format-file-list-filtered.txt
	rm cppcheck-file-list.txt
	xargs clang-format --dry-run --style=file -i <clang-format-file-list-filtered.txt
	rm clang-format-file-list-filtered.txt
fi
