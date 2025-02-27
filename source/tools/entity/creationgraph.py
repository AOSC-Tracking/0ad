#!/usr/bin/env python3
import logging
import sys
from os import chdir
from pathlib import Path
from re import split
from subprocess import run

from scriptlib import SimulTemplateEntity, find_files


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def find_entities(vfs_root):
    base = vfs_root / "public" / "simulation" / "templates"
    return [
        str(fp.relative_to(base).with_suffix(""))
        for (_, fp) in find_files(vfs_root, ["public"], "simulation/templates", "xml")
    ]


def main():
    vfs_root = Path(__file__).resolve().parents[3] / "binaries" / "data" / "mods"
    simul_templates_path = Path("simulation/templates")
    simul_template_entity = SimulTemplateEntity(vfs_root, logger)
    with open("creation.dot", "w", encoding="utf-8") as dot_f:
        dot_f.write("digraph G {\n")
        files = sorted(find_entities(vfs_root))
        for f in files:
            # TODO: not sure if excluding "mixins/" is correct
            if f.startswith(("template_", "mixins/")):
                continue
            print(f"# {f}...")
            entity = simul_template_entity.load_inherited(simul_templates_path, f, ["public"])
            if (
                entity.find("Builder") is not None
                and entity.find("Builder").find("Entities") is not None
            ):
                entities = (
                    entity.find("Builder")
                    .find("Entities")
                    .text.replace("{civ}", entity.find("Identity").find("Civ").text)
                )
                builders = split(r"\s+", entities.strip())
                for builder in builders:
                    if Path(builder) in files:
                        logger.warning("Invalid Builder reference: %s -> %s", f, builder)
                    dot_f.write(f'"{f}" -> "{builder}" [color=green];\n')
            if (
                entity.find("TrainingQueue") is not None
                and entity.find("TrainingQueue").find("Entities") is not None
            ):
                entities = (
                    entity.find("TrainingQueue")
                    .find("Entities")
                    .text.replace("{civ}", entity.find("Identity").find("Civ").text)
                )
                training_queues = split(r"\s+", entities.strip())
                for training_queue in training_queues:
                    if Path(training_queue) in files:
                        logger.warning(
                            "Invalid TrainingQueue reference: %s -> %s", f, training_queue
                        )
                    dot_f.write(f'"{f}" -> "{training_queue}" [color=blue];\n')
        dot_f.write("}\n")
    if run(["dot", "-V"], capture_output=True, check=False).returncode == 0:
        sys.exit(
            run(
                ["dot", "-Tsvg", "creation.dot", "-o", "creation.svg"], text=True, check=False
            ).returncode
        )


if __name__ == "__main__":
    chdir(Path(__file__).resolve().parent)
    main()
