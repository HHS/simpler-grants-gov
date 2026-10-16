from src.util.env_config import PydanticBaseEnvConfig


class SubmissionConsumerConfig(PydanticBaseEnvConfig):

    # How long to long-poll SQS for a batch of messages, in seconds
    submission_consumer_cycle_duration: int = 10  # SUBMISSION_CONSUMER_CYCLE_DURATION

    # How many batches to run - only used for testing,
    # we have no limit under ordinary circumstances
    submission_consumer_maximum_batch_count: int | None = (
        None  # SUBMISSION_CONSUMER_MAXIMUM_BATCH_COUNT
    )

    # Per-message timeout when processing in parallel. If a thread doesn't
    # return a result within this many seconds, we stop waiting on it,
    # treat the message as failed (kept on the queue), and move on.
    # The thread itself can't be forcibly killed - the DB transaction
    # opened inside it will commit or roll back when the underlying
    # operation eventually completes or errors; a commit after this
    # timeout is harmless as the redelivered message no-ops.
    # Sized above the slowest observed submission build (~70s in staging).
    submission_consumer_processing_timeout_sec: int = (
        120  # SUBMISSION_CONSUMER_PROCESSING_TIMEOUT_SEC
    )
