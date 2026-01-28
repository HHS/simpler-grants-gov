import logging
import random
import signal
import sys
import time
from dataclasses import dataclass
from types import FrameType

from sqlalchemy import text

from src.adapters import db
from src.adapters.db import flask_db
from src.util.env_config import PydanticBaseEnvConfig
from src.workflow.workflow_errors import NonRetryableWorkflowError, RetryableWorkflowError

logger = logging.getLogger(__name__)


@dataclass
class StubEvent:
    # Placeholder class until we have the
    # actual event types setup.
    event_data: str


class WorkflowManagerConfig(PydanticBaseEnvConfig):

    # How frequent we want a batch of events
    # to be fetched in seconds
    workflow_cycle_duration: int = 10  # WORKFLOW_CYCLE_DURATION

    # How many batches to run
    # Only used for testing, we have no limit
    # under ordinary circumstances
    workflow_maximum_batch_count: int | None = None  # WORKFLOW_MAXIMUM_BATCH_COUNT


class WorkflowManager:

    def __init__(self, config: WorkflowManagerConfig | None = None):
        self.sigterm_received = False
        self._register_signal_handlers()

        if config is None:
            config = WorkflowManagerConfig()
        self.config = config

        # Not sure yet how we'll handle metrics
        # This is just here to aid in testing at
        # the moment
        self.metrics = {
            "events_processed": 0,
            "batches_processed": 0,
        }

    def _register_signal_handlers(self) -> None:
        """Register signal handlers to handle expected
        signals like keyboard interrupts and kill commands.

        This changes the default behavior of "end the program instantly"
        into a more graceful approach. Note that not all signals
        can be caught, and many that indicate hardware faults shouldn't.
        """
        # Make it so if a SIGTERM is received, it doesn't
        # cause the process to instantly exit so we can gracefully
        # exit. SIGTERM is sent by either calling kill on the process ID
        # and is also sent by AWS when it tells an ECS task to scale down.
        # We have 30 seconds to gracefully shutdown before a SIGKILL will be sent.
        # We do not handle SIGKILL and will allow it to kill the process.
        # https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/
        #
        # This follows a similar pattern from gunicorn which runs our API server.
        # https://github.com/benoitc/gunicorn/blob/56b5ad87f8d72a674145c273ed8f547513c2b409/gunicorn/workers/base.py#L174
        signal.signal(signal.SIGTERM, self.handle_exit)

        # SIGINT is a keyboard interrupt, if you're running locally and hit CTRL+C.
        signal.signal(signal.SIGINT, self.handle_interrupt)

        # Most other signals indicate either errors or
        # more significant kill signals that we are fine
        # with causing the program to exit instantly as normal.

    def handle_exit(self, signum: int, frame: FrameType | None) -> None:
        logger.info(
            "Received interrupt signal, will allow current processing to complete before exiting."
        )
        self.sigterm_received = True

    def handle_interrupt(self, signum: int, frame: FrameType | None) -> None:
        logger.info("Received keyboard interrupt, exiting immediately.")
        sys.exit(0)

    def fetch_events(self) -> list[StubEvent]:
        # This will eventually be fetching events
        # from an SQS queue, just having it return a
        # random set of dummy events for the purposes
        # of testing.
        logger.info("Fetching workflow events")

        # Generate 1-5 random events
        events = []
        for i in range(random.randint(1, 5)):
            events.append(StubEvent(f"Random event {i}"))

        return events

    def process_events(self) -> None:
        """Process workflow events constantly

        The 'main' loop of the workflow manager.
        """
        logger.info("Processing workflow events")

        batch_count = 0
        while True:
            batch_count += 1
            start_time = time.perf_counter()

            self.process_batch()

            end_time = time.perf_counter()
            batch_duration = round(end_time - start_time, 3)
            logger.info(
                "Finished running workflow batch", extra={"batch_duration_sec": batch_duration}
            )

            # If a sigterm signal is received
            # we don't handle it until after
            # processing a batch has finished.
            if self.sigterm_received:
                logger.info("Exiting after receiving SIGTERM.")
                break

            # For the purposes of testing, we can configure a maximum batch
            # size count to break the loop after a certain number of iterations
            if (
                self.config.workflow_maximum_batch_count is not None
                and batch_count >= self.config.workflow_maximum_batch_count
            ):
                logger.info("Exiting after batch limit reached.")
                break

            # We want batches to run every 10 seconds at most
            # so sleep for the remaining time
            time_to_sleep = round(self.config.workflow_cycle_duration - batch_duration, 3)
            if time_to_sleep <= 0:
                time_to_sleep = 0
            logger.info("Sleeping after processing events", extra={"time_to_sleep": time_to_sleep})
            time.sleep(time_to_sleep)
            logger.info("Finished sleeping.")

        logger.info("Finished processing workflow events")

    def process_batch(self) -> None:
        """Fetch and process a batch of events from SQS."""
        events = self.fetch_events()

        # Note that the initial approach won't be multi-threaded
        # We'll follow-up on that later
        for event in events:
            try:
                handle_event(event)
            except RetryableWorkflowError:
                logger.warning("Encountered retryable workflow error", exc_info=True)
            except NonRetryableWorkflowError:
                logger.warning("Encountered non-retryable workflow error", exc_info=True)
                # In a future ticket, we'll write back the event to SQS
            except Exception:
                logger.exception("Failed to process event")

        # Very simple metrics for test purposes
        self.metrics["batches_processed"] += 1
        self.metrics["events_processed"] += len(events)


@flask_db.with_db_session()
def handle_event(db_session: db.Session, event: StubEvent) -> None:
    logger.info("Processing event", extra={"event_data": event.event_data})
    with db_session.begin():
        # Just verify that the DB connection works for now
        # by doing a very simple query.
        # Will replace later with more meaningful logic.
        result = db_session.scalar(text("SELECT 1 AS healthy"))
        if result != 1:
            raise Exception("Cannot query DB")

    logger.info("Finished processing event", extra={"event_data": event.event_data})
