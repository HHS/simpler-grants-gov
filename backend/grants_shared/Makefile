##################################################
# Constants
##################################################

APP_NAME := grants-shared

# Colors for output, can be used as:
# 	echo -e "this text is the default color $(RED) this text is red $(NO_COLOR) everything here is the default color again"
RED := \033[0;31m
NO_COLOR := \033[0m

# Required for CI flags below to work properly
SHELL = /bin/bash -o pipefail

# The APP_DIR variable is the path from the root of the repository to this Makefile.
# This variable is used to display errors from MyPy in the 'Files Changed'
# section of a pull request. If this is set to the incorrect value, you won't be able
# to see the errors on the correct files in that section
APP_DIR := backend\/grants_shared
ifdef CI
 DOCKER_EXEC_ARGS := -T -e CI -e PYTEST_ADDOPTS="--color=yes" -e UV_PUBLISH_TOKEN
 MYPY_FLAGS := --no-pretty
 MYPY_POSTPROC := | perl -pe "s/^(.+):(\d+):(\d+): error: (.*)/::warning file=$(APP_DIR)\/\1,line=\2,col=\3::\4/"
endif

DOCKER_CMD := docker compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME)

# By default, all python/uv commands will run inside of the docker container
# if you wish to run this natively, add PY_RUN_APPROACH=local to your environment vars
# You can set this by either running `export PY_RUN_APPROACH=local` in your shell or add
# it to your ~/.zshrc file (and run `source ~/.zshrc`)

ifeq "$(PY_RUN_APPROACH)" "local"
PY_RUN_CMD := uv run
else
PY_RUN_CMD := $(DOCKER_CMD)
endif

# Docker user configuration
# This logic is to avoid issues with permissions and mounting local volumes,
# which should be owned by the same UID for Linux distros. Mac OS can use root,
# but it is best practice to run things as with least permission where possible

# Can be set by adding user=<username> and/ or uid=<id> after the make command
# If variables are not set explicitly: try looking up values from current
# environment, otherwise fixed defaults.
# uid= defaults to 0 if user= set (which makes sense if user=root, otherwise you
# probably want to set uid as well).
ifeq ($(user),)
RUN_USER ?= $(or $(strip $(USER)),nodummy)
RUN_UID ?= $(or $(strip $(shell id -u)),4000)
else
RUN_USER = $(user)
RUN_UID = $(or $(strip $(uid)),0)
endif

export RUN_USER
export RUN_UID

##################################################
# Local Development Environment Setup
##################################################

setup-local:
	# Install dependencies
	uv sync --all-groups --locked

##################################################
# API Build & Run
##################################################

build:
	docker compose build

init: build

##################################################
# Testing
##################################################

test: ## Run all tests except for audit logging
	$(PY_RUN_CMD) pytest -m "not audit" $(args)

test-audit: ## Run audit logging tests
	$(PY_RUN_CMD) pytest -m "audit" $(args)

test-coverage:
	$(PY_RUN_CMD) coverage run --branch --source=src -m pytest -m "not audit" $(args)
	$(PY_RUN_CMD) coverage run --data-file=.coverage.audit --branch --source=src -m pytest -m "audit" $(args)
	$(PY_RUN_CMD) coverage combine --data-file=.coverage --append
	$(PY_RUN_CMD) coverage report

test-coverage-report: ## Open HTML test coverage report
	$(PY_RUN_CMD) coverage html --directory .coverage_report
	open .coverage_report/index.html


##################################################
# Formatting and linting
##################################################

format: ## Format files
	$(PY_RUN_CMD) isort --atomic src tests
	$(PY_RUN_CMD) black src tests

format-check: ## Check file formatting
	$(PY_RUN_CMD) isort --atomic --check-only src tests
	$(PY_RUN_CMD) black --check src tests

lint: lint-py ## Lint

lint-py: lint-ruff lint-mypy

lint-ruff:
	$(PY_RUN_CMD) ruff check .

lint-ruff-fix:
	$(PY_RUN_CMD) ruff check . --fix

lint-mypy:
	$(PY_RUN_CMD) mypy --show-error-codes $(MYPY_FLAGS) src $(MYPY_POSTPROC)

lint-security: # https://bandit.readthedocs.io/en/latest/index.html
	$(PY_RUN_CMD) bandit -c pyproject.toml -r . --number 3 --skip B101 -ll -x ./.venv


##################################################
# Release functionality
##################################################

bump-patch-version: ## Bump the patch version of the code (eg. 1.0.1 -> 1.0.2)
	uv version --bump patch

bump-minor-version: ## Bump the minor version of the code (eg. 1.0.1 -> 1.1.0)
	uv version --bump minor

##################################################
# Misc functionality
##################################################

docker-cmd:
	$(DOCKER_CMD) $(args)

help: ## Prints the help documentation and info about each command
	@grep -E '^[/a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'