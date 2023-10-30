# Grants Equity Analytics

This sub-directory enables users to run analytics on data generated within the Grants Equity project.

## Getting Started

### Pre-requisites

- Python version 3.10 or 3.11
- Poetry
- GitHub CLI

Check that you have the following with:

```
python --version
poetry --version
gh --version
```

### Installation

1. Clone the GitHub repo: `git clone https://github.com/HHS/simpler-grants-gov.git`
2. Change directory into the analytics folder: `cd simpler-grants-gov/analytics`
3. Check that you have the pre-requisites installed:
   ```
   python --version
   poetry --version
   gh --version
   ```
4. Set up the project: `make setup` -- This will install the required packages and prompt you to authenticate with GitHub

## Calculating Analytics

### Running the Sprint Report

From within the analytics sub-directory run: `make sprint_report`

This should open a new browser tab with a jupyter notebook see screenshot below:

![Screenshot of jupyter notebook](static/reporting-notebook-screenshot.png)
