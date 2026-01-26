<<<<<<< before updating
#############
# Constants #
#############

ORG ?= HHS
REPO ?= simpler-grants-gov
SPRINT_PROJECT ?= 13
ROADMAP_PROJECT ?= 12
OUTPUT_DIR ?= $(shell mkdir -p data && echo data)
CONFIG_DIR ?= config
PROJECT_CONFIG_FILE ?= $(CONFIG_DIR)/github-projects.json
ISSUE_FILE ?= $(OUTPUT_DIR)/delivery-data.json
SPRINT ?= @current
# Names of the points and sprint fields in the GitHub project
POINTS_FIELD ?= Story Points
SPRINT_FIELD ?= Sprint
UNIT ?= points
ACTION ?= show-results
MIN_TEST_COVERAGE ?= 80
APP_NAME ?= grants-analytics
EFFECTIVE_DATE ?= $(shell date +"%Y-%m-%d")

# Required for CI to work properly
SHELL = /bin/bash -o pipefail

ifdef CI
 DOCKER_EXEC_ARGS := -T -e CI -e GH_TOKEN -e ANALYTICS_SLACK_BOT_TOKEN -e ANALYTICS_REPORTING_CHANNEL_ID
else
 DOCKER_EXEC_ARGS := -e GH_TOKEN
endif

# By default, all python/poetry commands will run inside of the docker container
# if you wish to run this natively, add PY_RUN_APPROACH=local to your environment vars
# You can set this by either running `export PY_RUN_APPROACH=local` in your shell or add
# it to your ~/.zshrc file (and run `source ~/.zshrc`)
ifeq "$(PY_RUN_APPROACH)" "local"
POETRY := poetry run
GITHUB := gh
else
POETRY := docker compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME) poetry run
GITHUB := docker compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME) gh
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

##################
# Build Commands #
##################

check-prereqs:
	@echo "=> Checking for pre-requisites"
	@if ! poetry --version; then echo "=> Poetry isn't installed"; fi
	@if ! gh --version; then echo "=> GitHub CLI isn't installed" && exit 1; fi
	@echo "=> Poetry and GitHub CLI installed"

install: check-prereqs
	@echo "=> Installing python dependencies"
	poetry install

login:
	$(GITHUB) auth login

setup: install login

build:
	docker compose build
=======
.PHONY: \
	release-build
>>>>>>> after updating

release-build:
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.
<<<<<<< before updating

#########
# Tests #
#########

unit-test:
	@echo "=> Running unit tests"
	@echo "============================="
	$(POETRY) pytest --cov=src

e2e-test:
	@echo "=> Running end-to-end tests"
	@echo "============================="
	$(POETRY) pytest tests/integrations --cov=src --cov-append

test-audit: unit-test e2e-test
	@echo "=> Running test coverage report"
	@echo "============================="
	$(POETRY) coverage report --show-missing --fail-under=$(MIN_TEST_COVERAGE)

##########################
# Formatting and Linting #
##########################

format: ## runs code formatting
	@echo "=> Running code formatting"
	@echo "============================="
	$(POETRY) black src tests
	$(POETRY) ruff check --fix src tests
	@echo "============================="
	@echo "=> Code formatting complete"

format-check: ## runs code formatting checks
	@echo "=> Running code formatting checks"
	@echo "============================="
	$(POETRY) black --check src tests
	$(POETRY) ruff check src tests
	@echo "============================="
	@echo "=> All checks succeeded"

lint: ## runs code quality checks
	@echo "=> Running code quality checks"
	@echo "============================="
	$(POETRY) pylint src tests
	$(POETRY) mypy src
	@echo "============================="
	@echo "=> All checks succeeded"

#################
# Data Commands #
#################

db-migrate:
	@echo "=> Migrating the database schema"
	@echo "====================================================="
	$(POETRY) analytics etl db_migrate
	@echo "====================================================="

opportunity-load:
	@echo "=> Ingesting opportunity data into the database"
	@echo "====================================================="
	$(POETRY) analytics etl opportunity-load
	@echo "====================================================="

gh-extract-transform-and-load:
	@echo "=> Extract, transform and load GitHub data into analytics warebase"
	@echo "====================================================="
	$(POETRY) analytics etl extract_transform_and_load \
	--config-file $(PROJECT_CONFIG_FILE) \
	--effective-date $(EFFECTIVE_DATE)
	@echo "====================================================="

gh-transform-and-load:
	@echo "=> Transforming and loading GitHub data into the database"
	@echo "====================================================="
	$(POETRY) analytics etl transform_and_load \
	--issue-file $(ISSUE_FILE) \
	--effective-date $(EFFECTIVE_DATE)
	@echo "====================================================="

gh-data-export:
	@echo "=> Exporting GitHub issue and sprint data for delivery metrics"
	@echo "====================================================="
	$(POETRY)  analytics export gh_delivery_data \
	--config-file $(PROJECT_CONFIG_FILE) \
	--output-file $(ISSUE_FILE) \
	--temp-dir $(OUTPUT_DIR)

mb-backup:
	@echo "=> Backing up Metabase queries to disk"
	@echo "====================================================="
	$(POETRY) analytics metabase backup
	@echo "====================================================="

=======
>>>>>>> after updating
