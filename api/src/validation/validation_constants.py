from enum import StrEnum


class ValidationErrorType(StrEnum):
    """
    Error type codes which clients
    need to be aware of in order
    to display proper messaging to users.

    *** WARNING ***
    Do not adjust these values unless you
    are certain that any and all users
    are aware of the change, safer to add a new one
    """

    REQUIRED = "required"
    NOT_NULL = "not_null"
    UNKNOWN = "unknown"
    INVALID = "invalid"

    FORMAT = "format"
    INVALID_CHOICE = "invalid_choice"
    SPECIAL_NUMERIC = "special_numeric"

    MIN_LENGTH = "min_length"
    MAX_LENGTH = "max_length"
    MIN_OR_MAX_LENGTH = "min_or_max_length"
    EQUALS = "equals"

    MIN_VALUE = "min_value"
    MAX_VALUE = "max_value"
    MIN_OR_MAX_VALUE = "min_or_max_value"

    NOT_IN_PROGRESS = "not_in_progress"

    # Competition window validation error types
    COMPETITION_NOT_OPEN = "competition_not_open"

    # Application access validation error type
    UNAUTHORIZED_APPLICATION_ACCESS = "unauthorized_application_access"
    MISSING_REQUIRED_FORM = "missing_required_form"
    APPLICATION_FORM_VALIDATION = "application_form_validation"
    MISSING_APPLICATION_FORM = "missing_application_form"

    UNKNOWN_APPLICATION_ATTACHMENT = "unknown_application_attachment"

    MISSING_INCLUDED_IN_SUBMISSION = "missing_included_in_submission"

    ORGANIZATION_REQUIRED = "organization_required"
    ORGANIZATION_NO_SAM_GOV_ENTITY = "organization_no_sam_gov_entity"
    ORGANIZATION_INACTIVE_IN_SAM_GOV = "organization_inactive_in_sam_gov"
    ORGANIZATION_SAM_GOV_EXPIRED = "organization_sam_gov_expired"
