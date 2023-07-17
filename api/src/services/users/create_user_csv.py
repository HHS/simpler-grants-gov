import csv
import logging
from dataclasses import asdict, dataclass

from smart_open import open as smart_open

import src.adapters.db as db
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


@dataclass
class UserCsvRecord:
    user_name: str
    roles: str
    is_user_active: str


USER_CSV_RECORD_HEADERS = UserCsvRecord(
    user_name="User Name", roles="Roles", is_user_active="Is User Active?"
)


def create_user_csv(db_session: db.Session, output_file_path: str) -> None:
    # Get DB records
    user_records = get_user_records(db_session)

    csv_records = convert_user_records_for_csv(user_records)

    generate_csv_file(csv_records, output_file_path)


def get_user_records(db_session: db.Session) -> list[User]:
    logger.info("Fetching user records from DB")
    user_records = db_session.query(User).all()

    record_count = len(user_records)
    logger.info(
        "Found %s user records",
        record_count,
        extra={"user_records": record_count},
    )

    return user_records


def generate_csv_file(records: list[UserCsvRecord], output_file_path: str) -> None:
    logger.info("Generating user role CSV at %s", output_file_path)

    # smart_open can write files to local & S3
    with smart_open(output_file_path, "w") as outbound_file:
        csv_writer = csv.DictWriter(
            outbound_file,
            fieldnames=list(asdict(USER_CSV_RECORD_HEADERS).keys()),
            quoting=csv.QUOTE_ALL,
        )
        for record in records:
            csv_writer.writerow(asdict(record))

    logger.info("Successfully created user role CSV at %s", output_file_path)


def convert_user_records_for_csv(records: list[User]) -> list[UserCsvRecord]:
    logger.info("Converting user role records to CSV format")
    out_records: list[UserCsvRecord] = []
    out_records.append(USER_CSV_RECORD_HEADERS)

    for user in records:
        user_name = " ".join([user.first_name, user.last_name])
        roles = " ".join([role.type for role in user.roles]) if user.roles else ""

        out_records.append(
            UserCsvRecord(
                user_name=user_name,
                roles=roles,
                is_user_active=str(user.is_active),
            )
        )

    return out_records
