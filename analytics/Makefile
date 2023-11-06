setup:
	poetry install
	gh auth login

export_sprint_data:
	poetry run python cli.py --owner HHS --repo simpler-grants-gov --project 13

sprint_report:
	export_sprint_data
	poetry run jupyter notebook
