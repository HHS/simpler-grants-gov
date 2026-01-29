#####################
# Retryable Errors
#####################


class RetryableWorkflowError(Exception):
    """
    Errors derived from this are those that we should
    allow to be reprocessed.
    """

    pass


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


class WorkflowDoesNotExistError(NonRetryableWorkflowError):
    pass


class EntityNotFound(NonRetryableWorkflowError):
    pass
