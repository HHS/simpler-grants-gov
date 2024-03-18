# Overview

Feature flags are setup in the API to allow for configuring behavior of the endpoints.

The flags have a default value which can be adjusted by an environment variable per environment,
and also allow for overriding it via headers in the API endpoints.

## Naming Convention

Naming of feature flags has the following convention:
* Environment variables are always snake-case all-caps like `ENABLE_OPPORTUNITY_LOG_MSG`
* Header fields are always prefixed with `X-FF` and are capitalized-kebab-cased like `X-FF-Enable-Opportunity-Log-Msg`

The configuration internally within the API helps setup these values and maintain consistency.


# Adding a New Feature Flag

Add the flag to the `FeatureFlag` enum. The value of the enum will be used
to generate the environment variable name as well as the header field name as described above.

```py
class FeatureFlag(StrEnum):
    # ... Existing flags

    # This will be used as:
    # Header: X-FF-Enable-Opportunity-Log-Msg
    # EnvVar: ENABLE_OPPORTUNITY_LOG_MSG
    ENABLE_OPPORTUNITY_LOG_MSG = "enable_opportunity_log_msg"
```

Add the field to the `FeatureFlagConfig` class. Use the `get_env_var_name` function
to tell Pydantic what environment variable name to look for. The first value passed
into the `Field` function is the default in case it cannot find the environment variable.

NOTE: While this example uses a boolean, strings, numbers, and other fields would also
      work in this same way, so long as you can parse the text of the header/environment variable.

```py
class FeatureFlagConfig(PydanticBaseEnvConfig):
    # ... Existing config

    # ENABLE_OPPORTUNITY_LOG_MSG
    enable_opportunity_log_msg: bool = Field(
        False, alias=FeatureFlag.ENABLE_OPPORTUNITY_LOG_MSG.get_env_var_name()
    )
```

You can now load the environment variables by calling `get_feature_flag_config()`
while in the API. Note that `initialize()` needs to be called before this works,
which is done in `app.py`, so any API routes will have access to this.

If you wish to make this a header field that your route can take in, first define
a Marshmallow schema like so:

```py
class OpportunitySearchHeaderSchema(request_schema.OrderedSchema):
    # Header field: X-FF-Enable-Opportunity-Log-Msg
    # data_key is what the field will be set as in the request
    enable_opportunity_log_msg = fields.Boolean(
        data_key=FeatureFlag.ENABLE_OPPORTUNITY_LOG_MSG.get_header_name(),
        metadata={"description": "Whether to log a message in the opportunity endpoint"},
    )

    @post_load
    def post_load(self, data: dict, **kwargs: Any) -> FeatureFlagConfig:
        # This approach loads the feature flag config, merges in any overrides
        # (the enable_opportunity_log_msg field from the header) and returns the feature
        # flag config.
        # post_load is called after all validations are done on a Marshmallow
        # schema when loading from JSON and is a convenient place to convert to something
        # other than a dictionary.
        feature_flag_config = get_feature_flag_config()

        enable_opportunity_log_msg = data.get("enable_opportunity_log_msg", None)
        if enable_opportunity_log_msg is not None:
            feature_flag_config.enable_opportunity_log_msg = enable_opportunity_log_msg

        return feature_flag_config
```

Then you can use your new schema like so in a route, specifying it as an additional input.
Because we added the post_load implementation, instead of receiving a dictionary, we have a properly typed object.

```py
@opportunity_blueprint.post("/v1/opportunities/search")
@opportunity_blueprint.input(opportunity_schemas.OpportunitySearchV0Schema, arg_name="search_params")
@opportunity_blueprint.input(
      opportunity_schemas.OpportunitySearchHeaderV0Schema,
      location="headers",
      arg_name="feature_flag_config",
)
# many=True allows us to return a list of opportunity objects
@opportunity_blueprint.output(opportunity_schemas.OpportunityV0Schema(many=True))
@opportunity_blueprint.auth_required(api_key_auth)
@flask_db.with_db_session()
def opportunity_search(
        db_session: db.Session, search_params: dict, feature_flag_config: FeatureFlagConfig
) -> response.ApiResponse:
      if feature_flag_config.enable_opportunity_log_msg:
            logger.info("Feature flag enabled")

      # ... the rest of the route implementation
```

# Current Feature Flags

| Environment Variable       | Header Field | Description |
|----------------------------| ------------ |-------------|
| ENABLE_OPPORTUNITY_LOG_MSG | X-FF-Enable-Opportunity-Log-Msg | Placeholder for the implementation of the feature flag logic, just causes a small log message. |


# Future Enhancements

A few rough ideas for how we might expand feature flags in the future:
* Make it possible to update the configuration of a running API (ie. loading feature flags from another configurable location periodically)
* Setup a way for an api caller (eg. front-end website) to be able to fetch feature flag values from the API