#####################
# Retryable Errors
#####################


from src.constants.lookup_constants import ApprovalResponseType


class RetryableWorkflowError(Exception):
    """
    Errors derived from this are those that we should
    allow to be reprocessed.
    """

    pass


class UnexpectedStateError(RetryableWorkflowError):
    """
    Error that indicates something has happened that our
    logic doesn't expect to be possible and likely indicates
    some sort of bug - so we want to be able to retry.
    """

    pass


class ImplementationMissingError(RetryableWorkflowError):
    """
    Error indicates that we are missing a configuration or implementation
    detail that would be needed for workflow management to work correctly.
    """


#####################
# Non-retryable errors
#####################


class NonRetryableWorkflowError(Exception):
    """
    Errors derived from this are those that we consider
    to be invalid for retrying.
    For example, if we receive an event saying to
    act on a workflow that does not exist, retrying would not help.
    """


class InvalidEventError(NonRetryableWorkflowError):
    pass


class InvalidWorkflowTypeError(NonRetryableWorkflowError):
    pass


class InvalidWorkflowResponseTypeError(NonRetryableWorkflowError):
    pass


class DisallowedApprovalResponseTypeError(NonRetryableWorkflowError):
    """Error raised when an approval response type is not allowed for a specific approval configuration."""

    def __init__(self, message: str, allowed_approval_response_types: set[ApprovalResponseType]):
        super().__init__(message)
        self.allowed_approval_response_types = allowed_approval_response_types


class WorkflowDoesNotExistError(NonRetryableWorkflowError):
    pass


class EntityNotFound(NonRetryableWorkflowError):
    pass


class InvalidEntityForWorkflow(NonRetryableWorkflowError):
    pass


class UserDoesNotExist(NonRetryableWorkflowError):
    pass


class InactiveWorkflowError(NonRetryableWorkflowError):
    pass


class UserAccessError(NonRetryableWorkflowError):
    pass


class DuplicateApprovalError(NonRetryableWorkflowError):
    pass


class OpportunityWithoutAgencyError(NonRetryableWorkflowError):
    pass


class ConcurrentWorkflowError(NonRetryableWorkflowError):
    pass
