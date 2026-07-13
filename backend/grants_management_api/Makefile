##################################################
# Constants
##################################################

APP_NAME := grants-management-api

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
APP_DIR := backend\/grants_management_api
ifdef CI
 DOCKER_EXEC_ARGS := -T -e CI -e PYTEST_ADDOPTS="--color=yes"
 MYPY_FLAGS := --no-pretty
 # The perl command here modifies the output format to appear as a warning on the github action
 # See https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-a-warning-message
 MYPY_POSTPROC := | perl -pe "s/^(.+):(\d+):(\d+): error: (.*)/::warning file=$(APP_DIR)\/\1,line=\2,col=\3::\1:\2:\3 :error: \4/ or s/^/::warning ::/"
endif

# By default, all python/uv commands will run inside of the docker container
# if you wish to run this natively, add PY_RUN_APPROACH=local to your environment vars
# You can set this by either running `export PY_RUN_APPROACH=local` in your shell or add
# it to your ~/.zshrc file (and run `source ~/.zshrc`)
ifeq "$(PY_RUN_APPROACH)" "local"
PY_RUN_CMD := uv run
else
PY_RUN_CMD := docker compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME)
endif

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

export RUN_USER
export RUN_UID

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

setup-env-override-file: ## Setup the override.env file which can be added to for any env var overrides from local.env
	./bin/setup-env-override-file.sh $(args)

##################################################
# API Build & Run
##################################################

build:
	docker compose build

start: ## Start the API for CI/CD or local Dev work
	docker compose up grants-management-api --detach

run-logs: start ## Start the API and follow the logs
	docker compose logs --follow --no-color $(APP_NAME)

init-components: init-db

init: setup-env-override-file build init-components ## Run all of the init tasks (including build) to set up DB and other services. To do this "from scratch" use remake-backend instead

init-ci-cd: setup-env-override-file init-components ## Do not build, but do run all of the init tasks to set up DB, and other services. To do this "from scratch" use remake-backend instead


clean-volumes: ## Remove project docker volumes - which includes the DB, and OpenSearch state
	docker compose down --volumes
	docker compose -f ../docker-compose.db.yml down --volumes

volume-recreate: clean-volumes init ## Destroy current volumes, setup new ones - will remove all existing data

stop: ## Stop the docker containers
	docker compose down
	docker compose -f ../docker-compose.db.yml down

##################################################
# Miscellaneous Utilities
##################################################

login: start ## Start shell in running container
	docker exec -it $(APP_NAME) bash

console: ## Start interactive Python console
	$(PY_RUN_CMD) python -i -m tool.console.interactive

help: ## Prints the help documentation and info about each command
	@grep -E '^[/a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


##################################################
# Testing
##################################################

test: ## Run all tests
	$(PY_RUN_CMD) pytest $(args)


test-coverage: ## Run tests and generate coverage report
	$(PY_RUN_CMD) coverage run --branch --source=src -m pytest $(args)
	$(PY_RUN_CMD) coverage report

test-coverage-report: ## Open HTML test coverage report
	$(PY_RUN_CMD) coverage html --directory .coverage_report
	open .coverage_report/index.html

##################################################
# Formatting and linting
##################################################

format: ## Format files
	$(PY_RUN_CMD) isort --atomic src tests bin
	$(PY_RUN_CMD) black src tests bin

format-check: ## Check file formatting
	$(PY_RUN_CMD) isort --atomic --check-only src tests bin
	$(PY_RUN_CMD) black --check src tests bin

lint: lint-py ## Lint

lint-py: lint-ruff lint-mypy

lint-ruff:
	$(PY_RUN_CMD) ruff check .

lint-ruff-fix:
	$(PY_RUN_CMD) ruff check . --fix

lint-mypy:
	$(PY_RUN_CMD) mypy --show-error-codes $(MYPY_FLAGS) src bin $(MYPY_POSTPROC)

lint-security: # https://bandit.readthedocs.io/en/latest/index.html
	$(PY_RUN_CMD) bandit -c pyproject.toml -r . --number 3 --skip B101 -ll -x ./.venv

##################################################
# DB & migrations
##################################################

#########################
# DB running / setup
#########################

# Docker starts the image for the DB but it's not quite
# ready to accept connections so we add a brief wait script
init-db: start-db setup-postgres-db db-migrate

start-db:
	docker compose -f ../docker-compose.db.yml up --detach grants-db
	../scripts/wait-for-local-db.sh

setup-postgres-db: ## Does any initial setup necessary for our local database to work
	$(PY_RUN_CMD) setup-postgres-db

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

db-seed-local: ## Generate test records into your local database
	$(PY_RUN_CMD) db-seed-local $(args)

db-check-migrations: ## Verify the DB schema matches the DB migrations generated
	$(alembic_cmd) check || (echo -e "\n$(RED)Migrations are not up-to-date, make sure you generate migrations by running 'make db-migrate-create <msg>'$(NO_COLOR)"; exit 1)

##################################################
# Mock Oauth Server
##################################################

init-mock-oauth2: start-mock-oauth2

start-mock-oauth2:
	docker compose up --detach mock-oauth2-server

##################################################
# CLI Commands
##################################################

cmd: ## Run Flask app CLI command (Run `make cli args="--help"` to see list of CLI commands)
	$(FLASK_CMD) $(args)

# TODO - in the API side, we use the openapi-tools docker image
# We haven't set that up yet on this side, so changed it to grants-management-api for now
openapi-spec: ## Generate OpenAPI spec
	docker compose run --rm -e DB_CHECK_CONNECTION_ON_INIT=false grants-management-api flask --app src.app spec --format yaml --output openapi.generated.yml