# Grants Shared

This repo exists to contain the shared code used by the backend
of simpler.grants.gov which is made up of multiple backend services.

This code is not meant to be used outside of the [Simpler Grants](https://github.com/HHS/simpler-grants-gov) system. 

[License](https://github.com/HHS/simpler-grants-gov/blob/main/LICENSE.md)

## Installation
TODO - this code isn't yet in PyPi, so this won't actually work yet.
Will update instructions more thoroughly once it is available.

```shell
# Using pip
pip install grants_shared

# Using poetry
poetry add grants_shared

# Using uv
uv add grants_shared
```

## Usage
Guidance on common commands and running the application will come in later
versions as we're still getting this setup, but a few basic commands to get you started.

```shell
# Build the docker image
make build

# Run tests
make test

# Formatting and linting
make format
make lint
```