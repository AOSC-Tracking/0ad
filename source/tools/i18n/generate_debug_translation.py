#!/usr/bin/env python3
#
# Copyright (C) 2024 Wildfire Games.
# This file is part of 0 A.D.
#
# 0 A.D. is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# 0 A.D. is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with 0 A.D.  If not, see <http://www.gnu.org/licenses/>.

import argparse
import multiprocessing
import re
import sys
from collections.abc import Generator
from pathlib import Path

from i18n_helper import L10N_FOLDER_NAME, PROJECT_ROOT_DIRECTORY
from i18n_helper.catalog import Catalog


DEBUG_PREFIX = "X_X "

WORD_WRAP_REGEX = re.compile(r"\s|-")


def get_catalogs(
    input_file_path, filters: list[str] | None = None
) -> Generator[Catalog, None, None]:
    """Yield catalogs for each language for the given path and category."""
    category = input_file_path.stem.split(".")[0]
    for file_path in input_file_path.parent.glob(f"*.{category}.po"):
        if file_path.stem.startswith("long"):
            continue
        if not filters or file_path.stem.split(".")[0] in filters:
            yield Catalog.read_from(file_path, locale=file_path.stem.split(".")[0])


def longest_word(x: str) -> int:
    """Return the length of the longest word in x."""
    return len(max(WORD_WRAP_REGEX.split(x), key=len))


def generate_long_strings(input_file_path, output_file_path, languages=None, comparator=len):
    """Generate the 'long strings' debug catalog.

    This catalog contains the longest singular and plural string,
    found amongst all translated languages or a filtered subset.
    It can be used to check if GUI elements are large enough.
    The catalog is long.*.po
    """
    print("Generating", output_file_path.name)

    template_catalog = Catalog.read_from(input_file_path)
    # Pretend we write English to get plurals.
    long_string_catalog = Catalog(locale="en")

    # Fill catalog with English strings.
    for message in template_catalog:
        long_string_catalog.add(
            id=message.id,
            string=message.id,
            context=message.context,
            auto_comments=message.auto_comments,
        )

    # Load existing translation catalogs.
    existing_translation_catalogs = get_catalogs(input_file_path, languages)

    # If any existing translation has more characters than the average expansion, use that instead.
    for translation_catalog in existing_translation_catalogs:
        for long_string_catalog_message in long_string_catalog:
            translation_message = translation_catalog.get(
                long_string_catalog_message.id, long_string_catalog_message.context
            )
            if not translation_message or not translation_message.string:
                continue

            if (
                not long_string_catalog_message.pluralizable
                or not translation_message.pluralizable
            ):
                long_string_catalog_message.string = max(
                    [long_string_catalog_message.string, translation_message.string],
                    key=comparator,
                )
                continue

            longest_singular_string = max(
                [long_string_catalog_message.string[0], translation_message.string[0]],
                key=comparator,
            )
            longest_plural_string = max(
                [
                    *list(long_string_catalog_message.string[1:]),
                    translation_message.string[1 if len(translation_message.string) > 1 else 0],
                ],
                key=comparator,
            )

            long_string_catalog_message.string = [
                longest_singular_string,
                longest_plural_string,
            ]

    long_string_catalog.write_to(output_file_path)


def generate_debug(input_file_path, output_file_path):
    """Generate a debug catalog to identify untranslated strings.

    This prefixes all strings with DEBUG_PREFIX, to easily identify
    untranslated strings while still making the game navigable.
    The catalog is debug.*.po
    """
    print("Generating", output_file_path.name)

    template_catalog = Catalog.read_from(input_file_path)
    # Pretend we write English to get plurals.
    out_catalog = Catalog(locale="en")

    for message in template_catalog:
        if message.pluralizable:
            out_catalog.add(
                id=message.id,
                string=(DEBUG_PREFIX + message.id[0],),
                context=message.context,
                auto_comments=message.auto_comments,
            )
        else:
            out_catalog.add(
                id=message.id,
                string=DEBUG_PREFIX + message.id,
                context=message.context,
                auto_comments=message.auto_comments,
            )

    out_catalog.write_to(output_file_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--debug",
        help="Generate debug translation to identify non-translated strings.",
        action="store_true",
    )
    parser.add_argument(
        "--long",
        help='Generate the "long" translations, containing the longest strings across all '
        "languages. Useful to identify GUI elements which are too small.",
        action="store_true",
    )
    parser.add_argument(
        "--long2",
        help='Generate the "long2" translation, containing the strings with the longest '
        "individual words across all languages. Useful to identify GUI elements which are too "
        "small.",
        action="store_true",
    )
    parser.add_argument(
        "--languages", nargs="+", help="For long strings, restrict to these languages"
    )
    args = parser.parse_args()

    if not args.debug and not args.long and not args.long2:
        parser.print_help()
        sys.exit(0)

    found_pot_files = 0
    for input_file_path in Path(PROJECT_ROOT_DIRECTORY).glob(f"**/{L10N_FOLDER_NAME}/*.pot"):
        found_pot_files += 1
        if args.debug:
            output_file_path = input_file_path.parent / f"debug.{input_file_path.stem}.po"
            multiprocessing.Process(
                target=generate_debug, args=(input_file_path, output_file_path)
            ).start()
        if args.long:
            output_file_path = input_file_path.parent / f"long.{input_file_path.stem}.po"
            multiprocessing.Process(
                target=generate_long_strings,
                args=(input_file_path, output_file_path, args.languages),
            ).start()
        if args.long2:
            output_file_path = input_file_path.parent / f"long2.{input_file_path.stem}.po"
            multiprocessing.Process(
                target=generate_long_strings,
                args=(input_file_path, output_file_path, args.languages, longest_word),
            ).start()

    if found_pot_files == 0:
        print(
            "This script did not work because no '.pot' files were found. "
            "Please, run 'update_templates.py' to generate the '.pot' files, and run "
            "'pull_translations.py' to pull the latest translations from Transifex. "
            "Then you can run this script to generate '.po' files with obvious debug strings."
        )


if __name__ == "__main__":
    main()
