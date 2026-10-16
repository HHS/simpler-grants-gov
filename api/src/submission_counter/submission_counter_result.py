from enum import StrEnum


class SubmissionProcessingResult(StrEnum):
    SUCCESS = "success"
    # The application was already processed (eg. by the scheduled task
    # or a duplicate delivery of this message) - nothing to do.
    ALREADY_PROCESSED = "already_processed"
    # The application doesn't exist - retrying won't help.
    APPLICATION_NOT_FOUND = "application_not_found"
    # The message body couldn't be parsed - retrying won't help.
    PARSE_ERROR = "parse_error"
    # The application row is locked by another process (the scheduled
    # task, or a concurrent duplicate) - safe to retry later.
    LOCKED = "locked"
    # The application isn't in the submitted status - most likely the
    # transaction that sent this message hasn't committed yet. Retry.
    NOT_READY = "not_ready"
    # Something unexpected went wrong - the transaction rolled back. Retry.
    ERROR = "error"

    @property
    def should_delete(self) -> bool:
        return self in RESULTS_TO_DELETE


RESULTS_TO_DELETE = {
    SubmissionProcessingResult.SUCCESS,
    SubmissionProcessingResult.ALREADY_PROCESSED,
    SubmissionProcessingResult.APPLICATION_NOT_FOUND,
    SubmissionProcessingResult.PARSE_ERROR,
}
