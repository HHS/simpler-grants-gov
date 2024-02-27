"""Factories for generating test data.

These factories are used to generate test data for the tests. They are
used both for generating in memory objects and for generating objects
that are persisted to the database.

The factories are based on the `factory_boy` library. See
https://factoryboy.readthedocs.io/en/latest/ for more information.
"""
import random
from datetime import datetime
from typing import Optional

import factory
import factory.fuzzy
import faker
from sqlalchemy.orm import scoped_session

import src.adapters.db as db
import src.db.models.opportunity_models as opportunity_models
import src.db.models.transfer.topportunity_models as transfer_topportunity_models
import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityCategoryLegacy,
    OpportunityStatus,
)

_db_session: Optional[db.Session] = None

fake = faker.Faker()


def get_db_session() -> db.Session:
    # _db_session is only set in the pytest fixture `enable_factory_create`
    # so that tests do not unintentionally write to the database.
    if _db_session is None:
        raise Exception(
            """Factory db_session is not initialized.

            If your tests don't need to cover database behavior, consider
            calling the `build()` method instead of `create()` on the factory to
            not persist the generated model.

            If running tests that actually need data in the DB, pull in the
            `enable_factory_create` fixture to initialize the db_session.
            """
        )

    return _db_session


# The scopefunc ensures that the session gets cleaned up after each test
# it implicitly calls `remove()` on the session.
# see https://docs.sqlalchemy.org/en/20/orm/contextual.html
Session = scoped_session(lambda: get_db_session(), scopefunc=lambda: get_db_session())


class Generators:
    Now = factory.LazyFunction(datetime.now)
    UtcNow = factory.LazyFunction(datetime_util.utcnow)
    UuidObj = factory.Faker("uuid4", cast_to=None)
    PhoneNumber = factory.Sequence(lambda n: f"123-456-{n:04}")


class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = Session
        sqlalchemy_session_persistence = "commit"


class OpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.Opportunity

    opportunity_id = factory.Sequence(lambda n: n)

    opportunity_number = factory.Sequence(lambda n: f"ABC-{n}-XYZ-001")
    opportunity_title = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")

    agency = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])

    category = factory.fuzzy.FuzzyChoice(OpportunityCategory)
    # only set the category explanation if category is Other
    category_explanation = factory.Maybe(
        decider=factory.LazyAttribute(lambda o: o.category == OpportunityCategory.OTHER),
        yes_declaration=factory.Sequence(lambda n: f"Category as chosen by order #{n * n - 1}"),
        no_declaration=None,
    )

    is_draft = False  # Because we filter out drafts, just default these to False

    revision_number = 0  # We'll want to consider how we handle this when we add history

    summary = factory.RelatedFactory(
        "tests.src.db.models.factories.OpportunitySummaryFactory",
        factory_related_name="opportunity",
    )
    opportunity_assistance_listings = factory.RelatedFactoryList(
        "tests.src.db.models.factories.OpportunityAssistanceListingFactory",
        factory_related_name="opportunity",
        size=lambda: random.randint(1, 3),
    )
    link_funding_instruments = factory.RelatedFactoryList(
        "tests.src.db.models.factories.LinkFundingInstrumentOpportunityFactory",
        factory_related_name="opportunity",
        size=lambda: random.randint(1, 3),
    )
    link_funding_categories = factory.RelatedFactoryList(
        "tests.src.db.models.factories.LinkFundingCategoryOpportunityFactory",
        factory_related_name="opportunity",
        size=lambda: random.randint(1, 3),
    )
    link_applicant_types = factory.RelatedFactoryList(
        "tests.src.db.models.factories.LinkApplicantTypeOpportunityFactory",
        factory_related_name="opportunity",
        size=lambda: random.randint(1, 3),
    )


class OpportunitySummaryFactory(BaseFactory):
    class Meta:
        model = opportunity_models.OpportunitySummary

    opportunity = factory.SubFactory(OpportunityFactory)
    opportunity_id = factory.LazyAttribute(lambda s: s.opportunity.opportunity_id)

    opportunity_status = factory.fuzzy.FuzzyChoice(OpportunityStatus)

    summary_description = factory.LazyFunction(lambda: f"Example summary - {fake.paragraph()}")
    is_cost_sharing = factory.Faker("boolean")

    # Use the opportunity status to determine a reasonable due date
    close_date = factory.Maybe(
        decider=factory.LazyAttribute(
            lambda s: s.opportunity_status in [OpportunityStatus.CLOSED, OpportunityStatus.ARCHIVED]
        ),
        # If closed/archived, choose an old date
        yes_declaration=factory.Faker("date_between", start_date="-3w", end_date="-2w"),
        # otherwise a future date
        no_declaration=factory.Faker("date_between", start_date="+2w", end_date="+3w"),
    )
    close_date_description = factory.Faker("paragraph", nb_sentences=1)

    # Just a random recent post date
    post_date = factory.Faker("date_between", start_date="-3w", end_date="now")

    archive_date = factory.Maybe(
        decider=factory.LazyAttribute(lambda s: s.opportunity_status == OpportunityStatus.ARCHIVED),
        # If archived, choose an old date
        yes_declaration=factory.Faker("date_between", start_date="-3w", end_date="-2w"),
        # otherwise a future date
        no_declaration=factory.Faker("date_between", start_date="+2w", end_date="+3w"),
    )
    unarchive_date = None

    expected_number_of_awards = factory.Faker("random_int", min=1, max=25)
    estimated_total_program_funding = factory.Faker(
        "random_int", min=10_000, max=10_000_000, step=5_000
    )
    award_floor = factory.LazyAttribute(
        lambda s: s.estimated_total_program_funding / s.expected_number_of_awards
    )
    award_ceiling = factory.LazyAttribute(lambda s: s.estimated_total_program_funding)

    additional_info_url = factory.Iterator(["google.com", "grants.gov"])
    additional_info_url_description = "Click me for additional info"

    funding_category_description = factory.Maybe(
        decider=factory.LazyAttribute(lambda s: fake.boolean()),  # random chance to include value
        yes_declaration=factory.Faker("paragraph", nb_sentences=1),
        no_declaration=None,
    )
    applicant_eligibility_description = factory.Maybe(
        decider=factory.LazyAttribute(lambda s: fake.boolean()),  # random chance to include value
        yes_declaration=factory.Faker("paragraph", nb_sentences=5),
        no_declaration=None,
    )

    agency_code = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])
    agency_name = factory.Iterator(
        ["US Alphabetical Basic Corp", "US Xylophone Yak Zoo", "US Number Department"]
    )
    agency_phone_number = Generators.PhoneNumber
    agency_contact_description = factory.LazyFunction(
        lambda: f"For more information contact us at - {fake.paragraph()}"
    )
    agency_email_address = factory.Faker("email")
    agency_email_address_description = factory.LazyAttribute(
        lambda s: f"Contact {s.agency_name} via email"
    )


class OpportunityAssistanceListingFactory(BaseFactory):
    class Meta:
        model = opportunity_models.OpportunityAssistanceListing

    opportunity = factory.SubFactory(OpportunityFactory)
    opportunity_id = factory.LazyAttribute(lambda a: a.opportunity.opportunity_id)

    program_title = factory.Faker("company")
    assistance_listing_number = factory.LazyFunction(
        lambda: f"{fake.random_int(min=1, max=99):02}.{fake.random_int(min=1, max=999):03}"
    )


class LinkFundingInstrumentOpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.LinkFundingInstrumentOpportunity

    opportunity = factory.SubFactory(OpportunityFactory)
    opportunity_id = factory.LazyAttribute(lambda f: f.opportunity.opportunity_id)

    # We use an iterator here to keep the values unique when generated by the opportunity factory
    funding_instrument = factory.Iterator(FundingInstrument)


class LinkFundingCategoryOpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.LinkFundingCategoryOpportunity

    opportunity = factory.SubFactory(OpportunityFactory)
    opportunity_id = factory.LazyAttribute(lambda f: f.opportunity.opportunity_id)

    # We use an iterator here to keep the values unique when generated by the opportunity factory
    funding_category = factory.Iterator(FundingCategory)


class LinkApplicantTypeOpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.LinkApplicantTypeOpportunity

    opportunity = factory.SubFactory(OpportunityFactory)
    opportunity_id = factory.LazyAttribute(lambda f: f.opportunity.opportunity_id)

    # We use an iterator here to keep the values unique when generated by the opportunity factory
    applicant_type = factory.Iterator(ApplicantType)


####################################
# Transfer Table Factories
####################################


class TransferTopportunityFactory(BaseFactory):
    class Meta:
        model = transfer_topportunity_models.TransferTopportunity

    opportunity_id = factory.Sequence(lambda n: n)

    oppnumber = factory.Sequence(lambda n: f"ABC-{n}-XYZ-001")
    opptitle = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")

    owningagency = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])

    oppcategory = factory.fuzzy.FuzzyChoice(OpportunityCategoryLegacy)
    # only set the category explanation if category is Other
    category_explanation = factory.Maybe(
        decider=factory.LazyAttribute(lambda o: o.oppcategory == OpportunityCategoryLegacy.OTHER),
        yes_declaration=factory.Sequence(lambda n: f"Category as chosen by order #{n * n - 1}"),
        no_declaration=None,
    )

    is_draft = "N"  # Because we filter out drafts, just default these to False

    revision_number = 0

    # Make sure updated_at is after created_at just to make the data realistic
    created_at = factory.Faker("date_time")
    updated_at = factory.LazyAttribute(
        lambda o: fake.date_time_between(start_date=o.created_at, end_date="now")
    )

    created_date = factory.LazyAttribute(lambda o: o.created_at.date())
    last_upd_date = factory.LazyAttribute(lambda o: o.updated_at.date())


####################################
# Foreign Table Factories
####################################

class ForeignTopportunityFactory(factory.DictFactory):
    """
    NOTE: This generates a dictionary - and does not connect to the database directly
    """

    opportunity_id = factory.Sequence(lambda n: n)

    oppnumber = factory.Sequence(lambda n: f"F-ABC-{n}-XYZ-001")
    opptitle = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")

    owningagency = factory.Iterator(["F-US-ABC", "F-US-XYZ", "F-US-123"])

    oppcategory = factory.fuzzy.FuzzyChoice(OpportunityCategoryLegacy)
    # only set the category explanation if category is Other
    category_explanation = factory.Maybe(
        decider=factory.LazyAttribute(lambda o: o.oppcategory == OpportunityCategoryLegacy.OTHER),
        yes_declaration=factory.Sequence(lambda n: f"Category as chosen by order #{n * n - 1}"),
        no_declaration=None,
    )

    is_draft = "N"  # Because we filter out drafts, just default these to False

    revision_number = 0

    created_date = factory.Faker("date_between", start_date="-10y", end_date="-5y")
    last_upd_date = factory.Faker("date_between", start_date="-5y", end_date="today")