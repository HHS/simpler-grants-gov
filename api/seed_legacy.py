#!/usr/bin/env python3
"""
Script to add legacy users to seed organizations for local development.

This creates test legacy users in the staging tables (VuserAccount and TuserProfile)
linked to the seed organizations via their UEIs/DUNS.

Usage:
    docker compose exec grants-api poetry run python add_seed_legacy_users.py
"""

import logging
from datetime import datetime

import faker
from sqlalchemy import select

import src.adapters.db as db
import src.logging
from src.constants.lookup_constants import LegacyProfileType
from src.db.models.entity_models import Organization
from src.db.models.staging.user import TuserProfile, VuserAccount

logger = logging.getLogger(__name__)

fake = faker.Faker()
fake.seed_instance(12345)  # Set seed for reproducible fake data


def add_legacy_user(
    db_session: db.Session,
    email: str,
    first_name: str,
    last_name: str,
    uei: str,
    user_account_id: int,
) -> None:
    """Add a legacy user to the staging tables linked to an organization via UEI."""

    # Check if user already exists
    existing_user = db_session.execute(
        select(VuserAccount).where(VuserAccount.user_account_id == user_account_id)
    ).scalar_one_or_none()

    if existing_user:
        logger.info(f"Legacy user {email} already exists, skipping")
        return

    # Create VuserAccount record
    user_account = VuserAccount(
        user_account_id=user_account_id,
        user_id=f"legacy_user_{user_account_id}",
        email=email,
        first_name=first_name,
        last_name=last_name,
        full_name=f"{first_name} {last_name}",
        is_active="Y",
        is_deleted_legacy="N",
        is_duplicate="N",
        created_date=datetime.now(),
        creator_id="SEED_SCRIPT",
        last_upd_date=datetime.now(),
        last_upd_id="SEED_SCRIPT",
        is_deleted=False,  # StagingParamMixin field
    )
    db_session.add(user_account)

    # Create TuserProfile record linking user to organization via UEI
    user_profile = TuserProfile(
        user_profile_id=user_account_id,  # Use same ID for simplicity
        user_account_id=user_account_id,
        profile_name=f"{first_name} {last_name}",
        profile_duns=uei,  # This links the user to the organization
        profile_type_id=LegacyProfileType.ORGANIZATION_APPLICANT,
        is_deleted_legacy="N",
        is_default="Y",
        created_date=datetime.now(),
        creator_id="SEED_SCRIPT",
        last_upd_date=datetime.now(),
        last_upd_id="SEED_SCRIPT",
        is_deleted=False,  # StagingParamMixin field
    )
    db_session.add(user_profile)

    logger.info(f"Created legacy user {email} linked to UEI {uei}")


def main():
    """Add legacy users to each seed organization."""
    with src.logging.init(__package__):
        db_client = db.PostgresDBClient()

        with db_client.get_session() as db_session:
            # Get the seed organizations
            orgs = (
                db_session.execute(
                    select(Organization).where(
                        Organization.organization_id.in_(
                            [
                                "47d95649-c70d-44d9-ae78-68bf848e32f8",  # Sally's Soup Emporium
                                "50a7692e-743b-4c7b-bdb0-46ae087db33c",  # Fred's Fabric Hut
                                "71507bdc-fa0e-44a7-b17c-d79d15320476",  # Michelangelo's
                            ]
                        )
                    )
                )
                .scalars()
                .all()
            )

            if not orgs:
                logger.error("No seed organizations found. Run db-seed-local first.")
                return

            # Organization UEI mapping
            org_ueis = [
                ("FAKEUEI11111", "Sally's Soup Emporium"),
                ("FAKEUEI22222", "Fred's Fabric Hut"),
                ("FAKEUEI33333", "Michelangelo's Marketplace"),
            ]

            # Generate 15 users per organization using faker
            user_account_id = 900001
            total_created = 0

            for uei, org_name in org_ueis:
                logger.info(f"Creating 15 legacy users for {org_name} (UEI: {uei})")

                for i in range(15):
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                    email = f"{first_name.lower()}.{last_name.lower()}.{i+1}@example.com"

                    add_legacy_user(
                        db_session,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        uei=uei,
                        user_account_id=user_account_id,
                    )

                    user_account_id += 1
                    total_created += 1

            db_session.commit()

            logger.info(f"✓ Successfully added {total_created} legacy users to seed organizations")
            logger.info(f"  - 15 users per organization across 3 organizations")
            logger.info("You can now test legacy user discovery in the frontend")


if __name__ == "__main__":
    main()
