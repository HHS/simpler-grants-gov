from sqlalchemy import select

from src.adapters import db
from src.db.models.staging.user import TuserAccount, TuserAccountMapper


def get_legacy_user_for_login_gov_id(
    login_gov_id: str, db_session: db.Session
) -> TuserAccount | None:

    import pdb

    pdb.set_trace()
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
