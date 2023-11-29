"""Loads configuration variables from settings files and settings files

Dynaconf provides a few valuable features for configuration management:
- Load variables from env vars and files with predictable overrides
- Validate the existence and format of required configs
- Connect with secrets managers like HashiCorp's Vault server
- Load different configs based on environment (e.g. DEV, PROD, STAGING)

For more information visit: https://www.dynaconf.com/
"""
from dynaconf import Dynaconf, Validator, ValidationError

settings = Dynaconf(
    # set env vars with `export ANALYTICS_FOO=bar`
    envvar_prefix="ANALYTICS",
    # looks for config vars in the following files
    # with vars in .secrets.toml overriding vars in settings.toml
    settings_files=["settings.toml", ".secrets.toml"],
    # add validators for our required config vars
    validators=[
        Validator("SLACK_BOT_TOKEN", must_exist=True),
        Validator("REPORTING_CHANNEL_ID", must_exist=True),
    ],
)

# raises after all possible errors are evaluated
try:
    settings.validators.validate_all()
except ValidationError as error:
    list_of_all_errors = error.details
    print(list_of_all_errors)
    raise
