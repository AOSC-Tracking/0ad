#!/bin/sh
set -e

cd "$(dirname "$0")/../../../.."

while [ "$#" -gt 0 ]; do
	case "$1" in
		--from)
			# NOTE: Could be supported via eslint-plugin-diff
			from_commitish=$2
			printf "Option --to ignored: \n\n"
			shift
			;;
		--to)
			to_commitish=$2
			printf "Option --to ignored: \n\n"
			shift
			;;
		--package-manager)
			package_manager=$2
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

if [ "${package_manager}" = yarn ]; then
	yarn run lint --max-warnings=0
else
	npm run-script lint -- --max-warnings=0
fi

