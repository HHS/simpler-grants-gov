from src.submission_consumer.consumer import SubmissionConsumer
from src.submission_consumer.submission_consumer_blueprint import submission_consumer_blueprint
from src.task.service_background_task import service_background_task


@submission_consumer_blueprint.cli.command("run")
@service_background_task("submission-consumer")
def run_submission_consumer() -> None:
    """Main entry-point of the application submission consumer."""
    SubmissionConsumer().process_messages()
