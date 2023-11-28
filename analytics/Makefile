POETRY ?= poetry
GITHUB ?= gh

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

test:
	@echo "=> Running tests"
	@echo "============================="
	$(POETRY) run pytest
