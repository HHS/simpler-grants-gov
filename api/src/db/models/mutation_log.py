#
# Database table models for the mutation log.
#
# The mutation log has several uses:
#  • Log batch jobs that are running or completed
#  • Help to determine data lineage by associating rows with a batch job or API call
#

import datetime

import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from .base import ApiSchemaTable, TimestampMixin
from ...util import datetime_util


class MutationLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "mutation_log"

    mutation_log_id: Mapped[int] = mapped_column(sqlalchemy.BigInteger, primary_key=True)
    batch_name: Mapped[str] = mapped_column(index=True, nullable=True)
    batch_step: Mapped[str] = mapped_column(index=True, nullable=True)
    batch_task_id: Mapped[str] = mapped_column(nullable=True)
    api_operation: Mapped[str] = mapped_column(index=True, nullable=True)
    api_request_id: Mapped[str] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(nullable=True)
    report: Mapped[str] = mapped_column(nullable=True)
    total_count: Mapped[int] = mapped_column(sqlalchemy.BigInteger, nullable=True)
    success_count: Mapped[int] = mapped_column(sqlalchemy.BigInteger, nullable=True)
    error_count: Mapped[int] = mapped_column(sqlalchemy.BigInteger, nullable=True)
    started_at: Mapped[datetime.datetime] = mapped_column(
        index=True,
        nullable=False,
        default=datetime_util.utcnow,
        server_default=sqlalchemy.sql.functions.now(),
    )
    ended_at: Mapped[datetime.datetime] = mapped_column(nullable=True)
