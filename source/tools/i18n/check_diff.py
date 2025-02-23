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

import io
import os
import subprocess
from itertools import islice

from i18n_helper import PROJECT_ROOT_DIRECTORY


def get_diff(checkout_dir):
    """Return a diff using svn diff."""
    diff_process = subprocess.run(
        ["svn", "diff", os.path.join(checkout_dir, "binaries")], capture_output=True, check=False
    )
    if diff_process.returncode != 0:
        print(f"Error running svn diff: {diff_process.stderr.decode('utf-8')}. Exiting.")
        return None
    return io.StringIO(diff_process.stdout.decode("utf-8"))


def check_diff(diff: io.StringIO) -> list[str]:
    """Check a diff of .po files for meaningful changes.

    Run through a diff of .po files and check that some of the changes
    are real translations changes and not just noise (line changes....).
    The algorithm isn't extremely clever, but it is quite fast.
    """
    keep = set()
    files = set()

    curfile = None
    line = diff.readline()
    while line:
        if line.startswith("Index: binaries"):
            if not line.strip().endswith(".pot") and not line.strip().endswith(".po"):
                curfile = None
            else:
                curfile = line[7:].strip()
                files.add(curfile)
            # skip patch header
            diff.readline()
            diff.readline()
            diff.readline()
            diff.readline()
            line = diff.readline()
            continue
        if line[0] != "-" and line[0] != "+":
            line = diff.readline()
            continue
        if line[1:].strip() == "" or (line[1] == "#" and line[2] == ":"):
            line = diff.readline()
            continue
        if (
            "# Copyright (C)" in line
            or "POT-Creation-Date:" in line
            or "PO-Revision-Date" in line
            or "Last-Translator" in line
        ):
            line = diff.readline()
            continue
        # We've hit a real line
        if curfile:
            keep.add(curfile)
            curfile = None
        line = diff.readline()

    return list(files.difference(keep))


def revert_files(checkout_dir, files: list[str], verbose=False):
    def batched(iterable, n):
        """Split an iterable in equally sized chunks.

        Can be removed in favor of itertools.batched(), once Python
        3.12 is the minimum required Python version.
        """
        iterable = iter(iterable)
        return iter(lambda: tuple(islice(iterable, n)), ())

    errors = []
    for batch in batched(files, 100):
        files_in_batch = [os.path.join(checkout_dir, f) for f in batch]
        revert_process = subprocess.run(
            ["svn", "revert", *files_in_batch], capture_output=True, check=False
        )
        if revert_process.returncode != 0:
            errors.append(revert_process.stderr.decode())

    if verbose:
        for file in files:
            print(f"Reverted {file}")
    if errors:
        print()
        print("Warning: Some files could not be reverted. Errors:")
        print("\n".join(errors))


def add_untracked(checkout_dir, verbose=False):
    """Add untracked .po files to svn."""
    diff_process = subprocess.run(
        ["svn", "st", os.path.join(checkout_dir, "binaries")], capture_output=True, check=False
    )
    if diff_process.stderr != b"":
        print(f"Error running svn st: {diff_process.stderr.decode('utf-8')}. Exiting.")
        return

    for line in diff_process.stdout.decode("utf-8").split("\n"):
        if not line.startswith("?"):
            continue
        # Ignore non PO files. This is important so that the translator credits
        # correctly be updated, note however the script assumes a pristine SVN otherwise.
        file = line[1:].strip()
        if not file.endswith(".po") and not file.endswith(".pot"):
            continue
        add_process = subprocess.run(
            ["svn", "add", os.path.join(checkout_dir, file), "--parents"],
            capture_output=True,
            check=False,
        )
        if add_process.stderr != b"":
            print(f"Warning: file {file} could not be added.")
        if verbose:
            print(f"Added {file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--checkout-dir",
        help="Location of the SVN working copy.",
        action="store_true",
        default=PROJECT_ROOT_DIRECTORY,
    )
    parser.add_argument("--verbose", help="Print reverted files.", action="store_true")
    args = parser.parse_args()
    need_revert = check_diff(get_diff(args.checkout_dir))
    revert_files(args.checkout_dir, need_revert, args.verbose)
    add_untracked(args.checkout_dir, args.verbose)
