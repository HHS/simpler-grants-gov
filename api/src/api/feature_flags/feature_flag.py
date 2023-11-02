from enum import StrEnum


class FeatureFlag(StrEnum):
    """
    This enum class serves as a list of constant values for feature flags.

    A value like:
        EXAMPLE_FLAG_A = "example_flag_a"

    Would be able to have its default value set by setting the "EXAMPLE_FLAG_A" environment
    variable, and be overrideable in an endpoint by supplying it as "X-FF-Example-Flag-A" in a header.

    """

    ### NOTE: This is a placeholder for future work, and only serves as a proof of concept of the idea.
    #
    # Header: X-FF-Enable-Opportunity-Log-Msg
    # EnvVar: ENABLE_OPPORTUNITY_LOG_MSG
    ENABLE_OPPORTUNITY_LOG_MSG = "enable_opportunity_log_msg"

    def get_header_name(self) -> str:
        value = "-".join([v.capitalize() for v in self.value.lower().split("_")])

        return f"X-FF-{value}"

    def get_env_var_name(self) -> str:
        return self.value.upper()
