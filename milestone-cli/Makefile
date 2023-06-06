diagram_path := ./diagram.mmd
summary_path := ./summary.md

install:
	poetry install

lint:
	poetry run black milestone_cli tests
	poetry run ruff milestone_cli tests --fix
	poetry run mypy milestone_cli tests

requirements:
	poetry export -f requirements.txt -o requirements.txt --with dev --without-hashes
	echo ".  # installs project" >> requirements.txt

tox:
	make requirements
	poetry run tox

milestones-check:
	poetry run milestones validate

milestones-diagram:
ifneq ($(output_path),)
	poetry run milestones populate diagram $(output_path)
else
	poetry run milestones populate diagram $(diagram_path)
endif

milestones-summary:
ifneq ($(output_path),)
	poetry run milestones populate summary $(output_path)
else
	poetry run milestones populate summary $(summary_path)
endif
