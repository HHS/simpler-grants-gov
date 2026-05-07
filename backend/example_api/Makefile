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

FLASK_CMD := $(PY_RUN_CMD) flask

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


##################################################
# API Build & Run
##################################################

# TODO - have to figure out the Docker issues that prevent
# us from pulling in the shared package locally, so just run natively at the moment
run-logs:
	uv run flask --app src.app run --host 0.0.0.0 --port 8080 --reload

init-components: init-db


##################################################
# DB & migrations
##################################################

#########################
# DB running / setup
#########################

# TODO - this is missing the wait-for script logic
# need to figure out how we effectively reuse that (or just copy it)
start-db:
	docker compose up --detach example-db

setup-postgres-db: ## Does any initial setup necessary for our local database to work
	$(PY_RUN_CMD) setup-postgres-db

init-db: start-db setup-postgres-db db-migrate

#########################
# DB Migrations
#########################

alembic_config := ./src/db/migrations/alembic.ini
alembic_cmd := $(PY_RUN_CMD) alembic --config $(alembic_config)

db-migrate: ## Apply pending migrations to db
	$(PY_RUN_CMD) db-migrate

db-migrate-down: ## Rollback last migration in db
	$(PY_RUN_CMD) db-migrate-down

db-migrate-down-all: ## Rollback all migrations
	$(PY_RUN_CMD) db-migrate-down-all

check-migrate-msg:
ifndef MIGRATE_MSG
	$(error MIGRATE_MSG is undefined)
endif

db-migrate-create: check-migrate-msg ## Create database migration with description MIGRATE_MSG
	$(alembic_cmd) revision --autogenerate -m "$(MIGRATE_MSG)"

MIGRATE_MERGE_MSG := Merge multiple heads
db-migrate-merge-heads: ## Create a new migration that depends on all existing `head`s
	$(alembic_cmd) merge heads -m "$(MIGRATE_MERGE_MSG)" $(args)

db-migrate-current: ## Show current revision for a database
	$(alembic_cmd) current $(args)

db-migrate-history: ## Show migration history
	$(alembic_cmd) history $(args)

db-migrate-heads: ## Show migrations marked as a head
	$(alembic_cmd) heads $(args)


##################################################
# Testing
##################################################

test:
	$(PY_RUN_CMD) pytest $(args)

test-coverage:
	$(PY_RUN_CMD) coverage run --branch --source=src -m pytest $(args)
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
# Docker utils
##################################################

clean-volumes: ## Remove project docker volumes - which includes the DB, and OpenSearch state
	docker compose down --volumes

volume-recreate: clean-volumes init ## Destroy current volumes, setup new ones - will remove all existing data