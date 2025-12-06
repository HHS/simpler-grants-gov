from sqlalchemy import select

from src.adapters import db
from src.db.models.staging.user import TuserAccount, TuserAccountMapper


# TODO(#7340): Evaluate removing TuserAccount/TuserAccountMapper - no longer synced from Oracle
def get_legacy_user_for_login_gov_id(
    login_gov_id: str, db_session: db.Session
) -> TuserAccount | None:
    stmt = (
        select(TuserAccount)
        .join(
            TuserAccountMapper, TuserAccountMapper.user_account_id == TuserAccount.user_account_id
        )
        .where(TuserAccountMapper.ext_user_id == login_gov_id)
        .where(TuserAccountMapper.source_type == "GOV")
    )

    user = db_session.execute(stmt).scalars().one_or_none()

    return user
