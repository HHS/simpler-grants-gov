import signal
import sys
import time

from src.adapters import db
from src.adapters.db import flask_db
from src.task import task_blueprint
import logging

logger = logging.getLogger(__name__)


def fetch_events() -> list:
    # TODO - this would be SQS polling
    return ["event1", "event2", "event3"]

class WorkflowManager:

    def __init__(self):
        self.sigterm_received = False
        self._register_signal_handlers()

    def _register_signal_handlers(self):

        # Make it so if a SIGTERM is received, it doesn't
        # cause the process to instantly exit so we can gracefully
        # exit. SIGTERM is sent by either calling kill on the process ID
        # and is also sent by AWS when it tells an ECS task to scale down.
        # https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/
        #
        # This follows a similar pattern from gunicorn which runs our API server.
        # https://github.com/benoitc/gunicorn/blob/56b5ad87f8d72a674145c273ed8f547513c2b409/gunicorn/workers/base.py#L174
        signal.signal(signal.SIGTERM, self.handle_exit)
        # SIGINT is a keyboard interrupt, if you're running locally and hit CTRL+C.
        signal.signal(signal.SIGINT, self.handle_interrupt)
        # TODO - do we need any other signals?

        # TODO - Gunicorn did this, need to figure out what it does.
        # I think it's for making sure requests aren't interrupted
        # and might not be relevant, unless it impacts polling SQS.
        #signal.siginterrupt(signal.SIGTERM, False)

    def handle_exit(self, signum: int, frame) -> None:
        logger.info("Received interrupt signal, will allow current processing to complete before exiting.")
        self.sigterm_received = True

    def handle_interrupt(self, signum: int, frame) -> None:
        logger.info("Received keyboard interrupt, exiting immediately.")
        sys.exit(0)

    def process_events(self):
        while True:
            self.do_event_loop()

            # Just sleeping for the sake of testing.
            print("sleeping")
            time.sleep(3)
            print("Awake")

            if self.sigterm_received:
                logger.info("Exiting after receiving SIGTERM.")
                break

    def do_event_loop(self):
        events = fetch_events()

        for event in events:
            # TODO - probably want basic multi-threading
            #        that might require changing the signal handling
            handle_event(
                #db_session gets injected by the decorator.
                event=event
            )

@flask_db.with_db_session()
def handle_event(db_session: db.Session, event) -> None:
    # This is testing how the DB session injection works
    # This would call the workflow logic with the db session it gets here.

    # TODO - New Relic transaction logic should be here
    #        and probably some initialization elsewhere.

    with db_session.begin():
        # This is where we'd call the logic once I bother to connect that.
        print(event)

@task_blueprint.cli.command("workflow-main")
# TODO - need an alternative for the background task
# we want at least some of the setup, even if we don't
# quite want all of it.
def run_workflow_main():
    WorkflowManager().process_events()
