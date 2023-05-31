# Milestone CLI Tool

The milestone CLI tool streamlines the process of validating and publishing changes to the milestone summary yaml file.

## Getting Started

### Prerequisites

The following items are pre-requisites for installing this CLI tool:

- Python version 3.10 or greater
- Poetry 

Validate that these requirements are met with:
```shell
python --version
poetry --version
```

### Quickstart

1. Install the package: `poetry install`
2. Activate a shell: `poetry shell`
3. Validate the milestone yaml file: `milestones validate`
4. Populate the files:
   - Diagram: `milestones populate diagram ./diagram.mmd`
   - Summary: `milestones populate summary ./summary.md`
5. Exit the shell session: `exit`


## Made with

- Project Dependencies
  - pydantic - Extends python dataclasses for data (de)serialization and validation
  - typer - Enables building simple but powerful command-line interfaces
  - Jinja2 - Templating engine used to populate documents with data
  - PyYAML - (De)serializes data between yaml files and python objects
- Dev Dependencies
  - poetry - Python build tool and dependency manager
  - ruff - Fast python linter built in Rust
  - black - Auto-formatting for python
  - pytest - Unit test framework
  - tox - Test and linting orchestrator


## Roadmap

- Simplify setup with Makefile
- Expand validations that are run on load
- Improve exception handling and error messages
