#############
# Constants #
#############

ORG ?= HHS
REPO ?= simpler-grants-gov
SPRINT_PROJECT ?= 13
ROADMAP_PROJECT ?= 12
OUTPUT_DIR ?= data
SPRINT_FILE ?= $(OUTPUT_DIR)/sprint-data.json
ROADMAP_FILE ?= $(OUTPUT_DIR)/roadmap-data.json
ISSUE_FILE ?= $(OUTPUT_DIR)/issue-data.json
SPRINT ?= @current
UNIT ?= points
ACTION ?= show-results
MIN_TEST_COVERAGE ?= 80
APP_NAME ?= grants-analytics

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

release-build:
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.

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
	$(POETRY) ruff --fix src tests
	@echo "============================="
	@echo "=> Code formatting complete"

format-check: ## runs code formatting checks
	@echo "=> Running code formatting checks"
	@echo "============================="
	$(POETRY) black --check src tests
	$(POETRY) ruff  --fix --exit-non-zero-on-fix src tests
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

sprint-data-export:
	@echo "=> Exporting project data from the sprint board"
	@echo "====================================================="
	$(POETRY) analytics export gh_project_data \
	--owner $(ORG) \
	--project $(SPRINT_PROJECT) \
	--output-file $(SPRINT_FILE)

gh-db-data-import:
	@echo "=> Importing sprint data to the database"
	@echo "====================================================="
	$(POETRY) analytics import db_import \
	--sprint-file $(SPRINT_FILE) \
	--issue-file $(ISSUE_FILE)

roadmap-data-export:
	@echo "=> Exporting project data from the product roadmap"
	@echo "====================================================="
	$(POETRY) analytics export gh_project_data \
	--owner $(ORG) \
	--project $(ROADMAP_PROJECT) \
	--output-file $(ROADMAP_FILE)

issue-data-export:
	@echo "=> Exporting issue data from the repository"
	@echo "====================================================="
	$(POETRY) analytics export gh_issue_data \
	--owner $(ORG) \
	--repo $(REPO) \
	--output-file $(ISSUE_FILE)

gh-data-export: sprint-data-export issue-data-export roadmap-data-export

sprint-burndown:
	@echo "=> Running sprint burndown report"
	@echo "====================================================="
	$(POETRY) analytics calculate sprint_burndown \
	--sprint-file $(SPRINT_FILE) \
	--issue-file $(ISSUE_FILE) \
	--output-dir $(OUTPUT_DIR) \
	--sprint  "$(SPRINT)" \
	--unit $(UNIT) \
	--$(ACTION)

percent-complete:
	@echo "=> Running percent complete deliverable"
	@echo "====================================================="
	$(POETRY) analytics calculate deliverable_percent_complete \
	--sprint-file $(SPRINT_FILE) \
	--roadmap-file $(ROADMAP_FILE) \
	--issue-file $(ISSUE_FILE) \
	--output-dir $(OUTPUT_DIR) \
	--include-status "In Progress" \
  	--include-status "Planning" \
	--unit $(UNIT) \
	--$(ACTION)

sprint-reports: sprint-burndown percent-complete

sprint-reports-with-latest-data: gh-data-export sprint-reports

