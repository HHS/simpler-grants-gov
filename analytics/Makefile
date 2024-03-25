#############
# Constants #
#############

ORG ?= HHS
REPO ?= simpler-grants-gov
SPRINT_PROJECT ?= 13
SPRINT_FILE ?= data/sprint-data.json
ISSUE_FILE ?= data/issue-data.json
SPRINT ?= @current
UNIT ?= points
ACTION ?= show-results
MIN_TEST_COVERAGE ?= 80
APP_NAME ?= grants-analytics

# Required for CI to work properly
SHELL = /bin/bash -o pipefail

ifdef CI
 DOCKER_EXEC_ARGS := -T -e CI -e ANALYTICS_SLACK_BOT_TOKEN -e ANALYTICS_REPORTING_CHANNEL_ID
else
endif

# By default, all python/poetry commands will run inside of the docker container
# if you wish to run this natively, add PY_RUN_APPROACH=local to your environment vars
# You can set this by either running `export PY_RUN_APPROACH=local` in your shell or add
# it to your ~/.zshrc file (and run `source ~/.zshrc`)
ifeq "$(PY_RUN_APPROACH)" "local"
POETRY := poetry run
GITHUB := gh
else
POETRY := docker-compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME) poetry run
GITHUB := docker-compose run $(DOCKER_EXEC_ARGS) --rm $(APP_NAME) gh
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
	@if ! github --version; then echo "=> GitHub CLI isn't installed"; fi
	@echo "=> All pre-requisites satisfied"

install: check-prereqs
	@echo "=> Installing python dependencies"
	poetry install

login:
	gh auth login

build:
	docker-compose build

lint:
	@echo "=> Running code quality checks"
	@echo "============================="
	$(POETRY) black src tests
	$(POETRY) ruff src tests --fix
	$(POETRY) pylint src tests
	$(POETRY) mypy src
	@echo "============================="
	@echo "=> All checks succeeded"

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

release-build:
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.

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

issue-data-export:
	@echo "=> Exporting issue data from the repository"
	@echo "====================================================="
	$(POETRY) analytics export gh_issue_data \
	--owner $(ORG) \
	--repo $(REPO) \
	--output-file $(ISSUE_FILE)

gh-data-export: sprint-data-export issue-data-export

sprint-burndown:
	@echo "=> Running sprint burndown report"
	@echo "====================================================="
	poetry run analytics calculate sprint_burndown \
	--sprint-file $(SPRINT_FILE) \
	--issue-file $(ISSUE_FILE) \
	--sprint  "$(SPRINT)" \
	--unit $(UNIT) \
	--$(ACTION)

percent-complete:
	@echo "=> Running percent complete deliverable"
	@echo "====================================================="
	poetry run analytics calculate deliverable_percent_complete \
	--sprint-file $(SPRINT_FILE) \
	--issue-file $(ISSUE_FILE) \
	--unit $(UNIT) \
	--$(ACTION)

sprint-reports: sprint-burndown percent-complete

sprint-reports-with-latest-data: gh-data-export sprint-reports
