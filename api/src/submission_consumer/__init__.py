from src.submission_consumer.submission_consumer_blueprint import submission_consumer_blueprint

# Import the CLI module so its command registers against the blueprint
import src.submission_consumer.cli  # ruff: ignore[unused-import] isort:skip

__all__ = ["submission_consumer_blueprint"]
