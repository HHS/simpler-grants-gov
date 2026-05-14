##################################################
# Constants
##################################################

# Colors for output, can be used as:
# 	echo -e "this text is the default color $(RED) this text is red $(NO_COLOR) everything here is the default color again"
RED := \033[0;31m
NO_COLOR := \033[0m

# Required for CI flags below to work properly
SHELL = /bin/bash -o pipefail

ifdef CI
 DOCKER_EXEC_ARGS := -T -e CI -e PYTEST_ADDOPTS="--color=yes"
 MYPY_FLAGS := --no-pretty
 MYPY_POSTPROC := | perl -pe "s/^(.+):(\d+):(\d+): error: (.*)/::warning file=$(APP_DIR)\/\1,line=\2,col=\3::\4/"
endif

# TODO - add the switching logic - docker doesn't work yet, so being lazy
PY_RUN_CMD := uv run

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

release-build:
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.

##################################################
# Local Development Environment Setup
##################################################

setup-local:
	# Install dependencies
	uv sync --all-groups --locked


init-components: init-db

##################################################
# DB
##################################################

# TODO - this is missing the wait-for script logic
# need to figure out how we effectively reuse that (or just copy it)
start-db:
	docker compose up --detach shared-db

init-db: start-db

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