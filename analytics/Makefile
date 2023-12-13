POETRY ?= poetry
GITHUB ?= gh
ORG ?= HHS
REPO ?= simpler-grants-gov
SPRINT_PROJECT ?= 13
SPRINT_FILE ?= data/sprint-data.json
ISSUE_FILE ?= data/issue-data.json
SPRINT ?= @current
UNIT ?= points
ACTION ?= show-results
MIN_TEST_COVERAGE ?= 80

check-prereqs:
	@echo "=> Checking for pre-requisites"
	@if ! $(POETRY) --version; then echo "=> Poetry isn't installed"; fi
	@if ! $(GITHUB) --version; then echo "=> GitHub CLI isn't installed"; fi
	@echo "=> All pre-requisites satisfied"

install: check-prereqs
	@echo "=> Installing python dependencies"
	$(POETRY) install

setup:
	$(MAKE) install
	$(GITHUB) auth login

lint:
	@echo "=> Running code quality checks"
	@echo "============================="
	$(POETRY) run black src tests
	$(POETRY) run ruff src tests --fix
	$(POETRY) run pylint src tests
	$(POETRY) run mypy src
	@echo "============================="
	@echo "=> All checks succeeded"

unit-test:
	@echo "=> Running unit tests"
	@echo "============================="
	$(POETRY) run pytest --cov=src

e2e-test:
	@echo "=> Running end-to-end tests"
	@echo "============================="
	$(POETRY) run pytest tests/integrations --cov-append=src

test-audit: unit-test
	@echo "=> Auditing test coverage"
	@echo "============================="
	$(POETRY) run coverage report --show-missing --fail-under=$(MIN_TEST_COVERAGE)

sprint-data-export:
	@echo "=> Exporting project data from the sprint board"
	@echo "====================================================="
	$(POETRY) run analytics export gh_project_data \
	--owner $(ORG) \
	--project $(SPRINT_PROJECT) \
	--output-file $(SPRINT_FILE)

issue-data-export:
	@echo "=> Exporting issue data from the repository"
	@echo "====================================================="
	$(POETRY) run analytics export gh_issue_data \
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
